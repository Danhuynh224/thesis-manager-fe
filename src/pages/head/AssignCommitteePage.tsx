import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Select, Space, Table, message } from "antd";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CommitteeCard } from "../../components/common/CommitteeCard";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import {
  assignRegistration,
  createCommittee,
  getCommittees,
} from "../../services/committees.api";
import { getRegistrations } from "../../services/registrations.api";
import { getTerms } from "../../services/terms.api";
import { getLecturers } from "../../services/users.api";
import { getErrorMessage } from "../../utils/errors";
import { getRegistrationTitle } from "../../utils/registration";
import { queryKeys } from "../../utils/query-keys";

const committeeSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên hội đồng"),
  dot: z.string().min(1, "Vui lòng chọn đợt"),
  chairId: z.union([z.string(), z.number()]).refine(Boolean, "Chọn chủ tịch"),
  secretaryId: z
    .union([z.string(), z.number()])
    .refine(Boolean, "Chọn thư ký"),
  member1Email: z.string().optional(),
  member2Email: z.string().optional(),
  location: z.string().min(1, "Vui lòng nhập địa điểm"),
  defenseDate: z.string().min(1, "Vui lòng nhập ngày bảo vệ"),
});

type CommitteeFormValues = z.infer<typeof committeeSchema>;

export default function HeadAssignCommitteePage() {
  const queryClient = useQueryClient();
  const normalizeDefenseDate = (value: string) => new Date(value).toISOString();

  const committeesQuery = useQuery({
    queryKey: queryKeys.committees(),
    queryFn: () => getCommittees(),
  });

  const lecturersQuery = useQuery({
    queryKey: queryKeys.lecturers({ scope: "assign-committee" }),
    queryFn: () => getLecturers(),
  });

  const termsQuery = useQuery({
    queryKey: queryKeys.terms({ loai: "KLTN", scope: "assign-committee" }),
    queryFn: () => getTerms({ loai: "KLTN" }),
  });

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({
      loai: "KLTN",
      scope: "assign-committee",
    }),
    queryFn: () => getRegistrations({ loai: "KLTN" }),
  });

  const { control, handleSubmit, reset, formState } =
    useForm<CommitteeFormValues>({
      resolver: zodResolver(committeeSchema),
      mode: "onChange",
      defaultValues: {
        name: "",
        dot: "",
        chairId: "",
        secretaryId: "",
        member1Email: "",
        member2Email: "",
        location: "",
        defenseDate: "",
      },
    });

  const createMutation = useMutation({
    mutationFn: createCommittee,
    onSuccess: () => {
      message.success("Đã tạo hội đồng mới.");
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.committees() });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const assignMutation = useMutation({
    mutationFn: ({
      committeeId,
      registrationId,
    }: {
      committeeId: number | string;
      registrationId: number | string;
    }) => assignRegistration(committeeId, { registrationId }),
    onSuccess: () => {
      message.success("Đã gán sinh viên vào hội đồng.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({
          loai: "KLTN",
          scope: "assign-committee",
        }),
      });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const lecturerOptions = (lecturersQuery.data ?? []).map((lecturer) => ({
    label: lecturer.fullName,
    value: lecturer.email,
  }));

  return (
    <div className="page-stack">
      <PageHeader
        title="Phân công hội đồng"
        subtitle="Tạo hội đồng, xem cấu hình hiện có và gán từng hồ sơ KLTN vào hội đồng phù hợp."
      />

      <div className="page-grid two-up">
        <SectionCard title="Tạo hội đồng">
          <Form
            layout="vertical"
            onFinish={handleSubmit((values) =>
              createMutation.mutate({
                ...values,
                defenseDate: normalizeDefenseDate(values.defenseDate),
              }),
            )}
          >
            <FormInput control={control} name="name" label="Tên hội đồng" />
            <FormSelect
              control={control}
              name="dot"
              label="Đợt"
              options={(termsQuery.data ?? []).map((term) => ({
                label: term.name,
                value: term.code ?? term.name,
              }))}
            />
            <FormSelect
              control={control}
              name="chairId"
              label="Chủ tịch"
              options={lecturerOptions}
            />
            <FormSelect
              control={control}
              name="secretaryId"
              label="Thư ký"
              options={lecturerOptions}
            />
            <FormSelect
              control={control}
              name="member1Email"
              label="Thành viên 1"
              options={lecturerOptions}
            />
            <FormSelect
              control={control}
              name="member2Email"
              label="Thành viên 2"
              options={lecturerOptions}
            />
            <FormInput control={control} name="location" label="Địa điểm" />
            <FormInput
              control={control}
              name="defenseDate"
              label="Ngày bảo vệ"
              type="datetime-local"
            />
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              disabled={!formState.isValid}
            >
              Tạo hội đồng
            </Button>
          </Form>
        </SectionCard>

        <SectionCard title="Hội đồng đã tạo">
          <div className="page-stack">
            {(committeesQuery.data ?? []).map((committee) => (
              <CommitteeCard key={committee.id} committeeId={committee.id} />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Gán sinh viên vào hội đồng">
        <Table
          rowKey="id"
          dataSource={registrationsQuery.data ?? []}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: "Sinh viên",
              render: (_, record) => record.student?.fullName ?? "--",
            },
            {
              title: "Đề tài",
              render: (_, record) => getRegistrationTitle(record),
            },
            {
              title: "Hội đồng hiện tại",
              render: (_, record) => record.committee?.name ?? "Chưa gán",
            },
            {
              title: "Chọn hội đồng",
              render: (_, record) => (
                <Space>
                  <Select
                    style={{ minWidth: 220 }}
                    placeholder="Chọn hội đồng"
                    onChange={(committeeId) =>
                      assignMutation.mutate({
                        committeeId,
                        registrationId: record.id,
                      })
                    }
                    options={(committeesQuery.data ?? []).map((committee) => ({
                      label: committee.name ?? `Hội đồng ${committee.id}`,
                      value: committee.id,
                    }))}
                  />
                </Space>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
