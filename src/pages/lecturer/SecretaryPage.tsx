import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Space, message } from "antd";
import { useMemo, useState } from "react";
import { DefenseSummarySection } from "../../components/defense/DefenseSummarySection";
import { MinutePanel } from "../../components/defense/MinutePanel";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { RegistrationTable } from "../../components/tables/RegistrationTable";
import { generateMinutes, getMinutesByRegistration } from "../../services/minutes.api";
import {
  getRegistrationDetail,
  getRegistrations,
  updateStatus,
} from "../../services/registrations.api";
import {
  finalizeScore,
  getScoresSummaryByRegistration,
} from "../../services/scores.api";
import type { Registration } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { queryKeys } from "../../utils/query-keys";

export default function LecturerSecretaryPage() {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(
    null,
  );
  const queryClient = useQueryClient();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ roleView: "secretary" }),
    queryFn: () => getRegistrations({ roleView: "secretary" }),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.registration(selectedRegistration?.id),
    queryFn: () => getRegistrationDetail(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const scoresQuery = useQuery({
    queryKey: queryKeys.scores(selectedRegistration?.id),
    queryFn: () => getScoresSummaryByRegistration(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const minutesQuery = useQuery({
    queryKey: queryKeys.minutes(selectedRegistration?.id),
    queryFn: () => getMinutesByRegistration(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const currentRegistration = detailQuery.data ?? selectedRegistration;
  const currentStatus = currentRegistration?.status;
  const isCommitteeScoringStage =
    currentStatus === "WAITING_COMMITTEE_SCORE" ||
    currentStatus === "DEFENSE_SCHEDULED";
  const isDefendedStage = currentStatus === "DEFENDED";

  const refreshSelectedRegistrationData = async () => {
    if (!selectedRegistration?.id) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({ roleView: "secretary" }),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.registration(selectedRegistration.id),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.scores(selectedRegistration.id),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.minutes(selectedRegistration.id),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents(selectedRegistration.id),
      }),
    ]);
  };

  const generateMutation = useMutation({
    mutationFn: async (registrationId: number | string) => {
      await generateMinutes(registrationId);
      return getMinutesByRegistration(registrationId);
    },
    onSuccess: async () => {
      message.success("Đã sẵn sàng biên bản hội đồng.");
      await refreshSelectedRegistrationData();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const finalizeMutation = useMutation({
    mutationFn: (registrationId: number | string) => finalizeScore(registrationId),
    onSuccess: async () => {
      message.success("Đã tổng hợp kết quả bảo vệ.");
      await refreshSelectedRegistrationData();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number | string;
      status: string;
    }) => updateStatus(id, { status }),
    onSuccess: async () => {
      message.success("Đã cập nhật trạng thái sau bảo vệ.");
      await refreshSelectedRegistrationData();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const finalAverage = useMemo(
    () => scoresQuery.data?.final?.average ?? currentRegistration?.finalScore,
    [scoresQuery.data?.final?.average, currentRegistration?.finalScore],
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Thư ký hội đồng"
        subtitle="Tổng hợp kết quả bảo vệ, mở biên bản hội đồng và cập nhật trạng thái sau bảo vệ."
      />

      <SectionCard title="Danh sách cần tổng hợp">
        <RegistrationTable
          data={registrationsQuery.data ?? []}
          extraColumns={[
            {
              title: "Điểm final",
              render: (_, record) => record.finalScore ?? "--",
            },
          ]}
          actions={(registration) => (
            <Space wrap>
              <Button
                type="primary"
                size="small"
                onClick={() => setSelectedRegistration(registration)}
              >
                Xem tổng hợp
              </Button>
            </Space>
          )}
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedRegistration)}
        onCancel={() => setSelectedRegistration(null)}
        footer={null}
        width={980}
        title="Thư ký tổng hợp kết quả bảo vệ"
      >
        {selectedRegistration ? (
          <div className="page-stack">
            <DefenseSummarySection
              scores={scoresQuery.data}
              loading={scoresQuery.isLoading}
            />

            <MinutePanel
              minute={minutesQuery.data}
              loading={minutesQuery.isLoading}
              generating={generateMutation.isPending}
              onOpenOrGenerate={() =>
                generateMutation.mutate(selectedRegistration.id)
              }
            />

            {isCommitteeScoringStage ? (
              <SectionCard title="Tổng hợp kết quả bảo vệ">
                <Space wrap>
                  <Button
                    type="primary"
                    loading={finalizeMutation.isPending}
                    onClick={() => finalizeMutation.mutate(selectedRegistration.id)}
                  >
                    Tổng hợp kết quả bảo vệ
                  </Button>
                </Space>
                <div className="field-hint" style={{ marginTop: 8 }}>
                  Điểm final hiện tại: {finalAverage ?? "--"}
                </div>
              </SectionCard>
            ) : null}

            {isDefendedStage ? (
              <SectionCard title="Kết luận sau bảo vệ">
                <Space wrap>
                  <Button
                    loading={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedRegistration.id,
                        status: "COMPLETED",
                      })
                    }
                  >
                    Hoàn thành
                  </Button>
                  <Button
                    type="primary"
                    loading={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedRegistration.id,
                        status: "WAITING_REVISED_UPLOAD",
                      })
                    }
                  >
                    Cần chỉnh sửa
                  </Button>
                  <Button
                    danger
                    loading={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedRegistration.id,
                        status: "REJECTED_AFTER_DEFENSE",
                      })
                    }
                  >
                    Rớt
                  </Button>
                </Space>
              </SectionCard>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
