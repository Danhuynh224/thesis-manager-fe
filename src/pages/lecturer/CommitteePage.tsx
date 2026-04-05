import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Descriptions, Modal, Space, message } from "antd";
import { useMemo, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { ScoreForm, type ScoreFormValues } from "../../components/score/ScoreForm";
import { RegistrationTable } from "../../components/tables/RegistrationTable";
import { getCommitteeById, getCommittees } from "../../services/committees.api";
import { getRegistrations } from "../../services/registrations.api";
import {
  createScore,
  getScoresSummaryByRegistration,
} from "../../services/scores.api";
import { useAuthStore } from "../../store/auth.store";
import type { Registration } from "../../types/models";
import { formatDateTimeVi } from "../../utils/datetime";
import { getErrorMessage } from "../../utils/errors";
import { canCommitteeScoreKltn } from "../../utils/kltn-permissions";
import { queryKeys } from "../../utils/query-keys";

export default function LecturerCommitteePage() {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(
    null,
  );
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ roleView: "committee" }),
    queryFn: () => getRegistrations({ roleView: "committee" }),
  });

  const committeesQuery = useQuery({
    queryKey: queryKeys.committees({ scope: "committee-page" }),
    queryFn: () => getCommittees(),
  });

  const committeeDetailQuery = useQuery({
    queryKey: queryKeys.committee(selectedRegistration?.committeeId),
    queryFn: () => getCommitteeById(selectedRegistration!.committeeId!),
    enabled: Boolean(selectedRegistration?.committeeId),
  });

  const scoresQuery = useQuery({
    queryKey: queryKeys.scores(selectedRegistration?.id),
    queryFn: () => getScoresSummaryByRegistration(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const resolveCommitteeRole = (registration?: Registration | null) => {
    const userEmail = currentUser?.email;
    const committee = committeeDetailQuery.data ?? registration?.committee;

    if (!userEmail || !committee) {
      return "COMMITTEE_MEMBER";
    }

    if (committee.chairEmail === userEmail) {
      return "COMMITTEE_CHAIR";
    }

    if (committee.secretaryEmail === userEmail) {
      return "COMMITTEE_SECRETARY";
    }

    return "COMMITTEE_MEMBER";
  };

  const currentCommitteeRole = useMemo(
    () => resolveCommitteeRole(selectedRegistration),
    [committeeDetailQuery.data, currentUser?.email, selectedRegistration],
  );

  const currentUserScore = useMemo(() => {
    const userEmail = currentUser?.email;

    if (!userEmail || !scoresQuery.data) {
      return null;
    }

    return (
      scoresQuery.data.committee.find(
        (score) =>
          score.role === currentCommitteeRole &&
          score.lecturerEmail === userEmail,
      ) ?? null
    );
  }, [currentCommitteeRole, currentUser?.email, scoresQuery.data]);

  const hasCurrentUserScored = useMemo(() => {
    return Boolean(currentUserScore);
  }, [currentUserScore]);

  const scoreMutation = useMutation({
    mutationFn: (
      values: ScoreFormValues & {
        registrationId: number | string;
        vaiTroCham: string;
      },
    ) =>
      createScore({
        ...values,
        registrationId: values.registrationId,
        vaiTroCham: values.vaiTroCham,
      }),
    onSuccess: async () => {
      message.success("Đã lưu điểm hội đồng.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.registrations({ roleView: "committee" }),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.scores(selectedRegistration?.id),
        }),
      ]);
      setSelectedRegistration(null);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Thành viên hội đồng"
        subtitle="Xem lịch bảo vệ, chi tiết hội đồng và nhập điểm hội đồng."
      />

      <SectionCard title="Danh sách sinh viên trong hội đồng">
        <RegistrationTable
          data={registrationsQuery.data ?? []}
          extraColumns={[
            {
              title: "Hội đồng",
              render: (_, record) =>
                record.committee?.name ??
                committeesQuery.data?.find(
                  (committee) => String(committee.id) === String(record.committeeId),
                )?.name ??
                "Chưa xếp",
            },
            {
              title: "Ngày bảo vệ",
              render: (_, record) =>
                formatDateTimeVi(
                  record.committee?.defenseDate ?? record.defenseDate,
                  "--",
                ),
            },
            {
              title: "Địa điểm",
              render: (_, record) =>
                record.committee?.location ?? record.defenseLocation ?? "--",
            },
          ]}
          actions={(registration) =>
            canCommitteeScoreKltn(registration) ? (
              <Space wrap>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => setSelectedRegistration(registration)}
                >
                  Nhập điểm
                </Button>
              </Space>
            ) : null
          }
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedRegistration)}
        onCancel={() => setSelectedRegistration(null)}
        footer={null}
        title={
          committeeDetailQuery.data?.name
            ? `Nhập điểm - ${committeeDetailQuery.data.name}`
            : "Nhập điểm hoi dong"
        }
      >
        {selectedRegistration ? (
          hasCurrentUserScored ? (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Hội đồng">
                {committeeDetailQuery.data?.name ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                {currentCommitteeRole}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm tổng">
                {currentUserScore?.totalScore ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu chí 1">
                {currentUserScore?.score1 ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu chí 2">
                {currentUserScore?.score2 ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu chí 3">
                {currentUserScore?.score3 ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Nhận xét">
                {currentUserScore?.comments ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Câu hỏi">
                {currentUserScore?.questions ?? "--"}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <ScoreForm
              loading={scoreMutation.isPending || committeeDetailQuery.isLoading}
              onSubmit={(values) =>
                scoreMutation.mutate({
                  ...values,
                  registrationId: selectedRegistration.id,
                  vaiTroCham: currentCommitteeRole,
                })
              }
            />
          )
        ) : null}
      </Modal>
    </div>
  );
}

