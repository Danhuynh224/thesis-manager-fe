import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, message } from "antd";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import {
  createKltn,
  getMyRegistrations,
} from "../../services/registrations.api";
import { getTerms } from "../../services/terms.api";
import { getLecturers, getMyFields } from "../../services/users.api";
import { getErrorMessage } from "../../utils/errors";
import { getLatestPassedBctt } from "../../utils/registration";
import { queryKeys } from "../../utils/query-keys";

const registerKltnSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tên đề tài"),
  fieldName: z.string().min(1, "Vui lòng chọn lĩnh vực"),
  companyName: z.string().optional(),
  supervisorId: z
    .union([z.string(), z.number()])
    .refine(Boolean, "Vui lòng chọn GVHD"),
  termId: z
    .union([z.string(), z.number()])
    .refine(Boolean, "Vui lòng chọn đợt"),
});

type RegisterKltnValues = z.infer<typeof registerKltnSchema>;

export default function StudentRegisterKltnPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ scope: "me" }),
    queryFn: getMyRegistrations,
  });

  const latestPassedBctt = getLatestPassedBctt(registrationsQuery.data);
  const isEligible = Boolean(latestPassedBctt);

  const { control, handleSubmit, setValue, formState } =
    useForm<RegisterKltnValues>({
      resolver: zodResolver(registerKltnSchema),
      mode: "onChange",
      defaultValues: {
        title: latestPassedBctt?.topicTitle ?? latestPassedBctt?.title ?? "",
        fieldName: latestPassedBctt?.fieldName ?? "",
        companyName: latestPassedBctt?.companyName ?? "",
        supervisorId: "",
        termId: "",
      },
    });

  useEffect(() => {
    if (latestPassedBctt?.supervisor?.email) {
      setValue("supervisorId", latestPassedBctt.supervisor.email);
    }
  }, [latestPassedBctt?.supervisor?.email, setValue]);

  const selectedField = useWatch({ control, name: "fieldName" });

  const termsQuery = useQuery({
    queryKey: queryKeys.terms({ loai: "KLTN", isActive: true }),
    queryFn: () => getTerms({ loai: "KLTN", isActive: true }),
  });

  const fieldsQuery = useQuery({
    queryKey: queryKeys.myFields,
    queryFn: getMyFields,
  });

  const lecturersQuery = useQuery({
    queryKey: queryKeys.lecturers({ fieldName: selectedField, loai: "KLTN" }),
    queryFn: () => getLecturers({ fieldName: selectedField }),
    enabled: Boolean(selectedField) && isEligible,
  });

  const createMutation = useMutation({
    mutationFn: createKltn,
    onSuccess: () => {
      message.success("Đăng ký KLTN thành công.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({ scope: "me" }),
      });
      navigate("/student/status");
    },
    onError: (error) => {
      message.error(getErrorMessage(error));
    },
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Đăng ký KLTN"
        subtitle="Hệ thống chỉ mở form khi sinh viên đã đạt BCTT ở đợt trước."
      />

      {!isEligible ? (
        <Alert
          type="warning"
          message="Bạn chưa đủ điều kiện đăng ký KLTN"
          description="Hệ thống cần xác nhận bạn đã có hồ sơ BCTT ở trạng thái Đạt trước khi mở form KLTN."
        />
      ) : null}

      <SectionCard title="Biểu mẫu đăng ký KLTN">
        <Form
          layout="vertical"
          onFinish={handleSubmit((values) => createMutation.mutate(values))}
        >
          <FormInput
            control={control}
            name="title"
            label="Tên đề tài"
            placeholder="Nhập tên khóa luận"
          />
          <FormInput
            control={control}
            name="companyName"
            label="Công ty"
            placeholder="Tên doanh nghiệp hoặc đơn vị liên kết"
          />
          <FormSelect
            control={control}
            name="fieldName"
            label="Lĩnh vực"
            placeholder="Chọn lĩnh vực"
            options={(fieldsQuery.data ?? []).map((field) => ({
              label: field,
              value: field,
            }))}
            loading={fieldsQuery.isLoading}
            disabled={!isEligible}
          />
          <FormSelect
            control={control}
            name="supervisorId"
            label="Giảng viên hướng dẫn"
            placeholder="Chọn GVHD"
            options={(lecturersQuery.data ?? []).map((lecturer) => ({
              label: lecturer.fullName,
              value: lecturer.email,
            }))}
            loading={lecturersQuery.isLoading}
            disabled={!isEligible || !selectedField}
          />
          <FormSelect
            control={control}
            name="termId"
            label="Đợt KLTN"
            placeholder="Chọn đợt"
            options={(termsQuery.data ?? []).map((term) => ({
              label: term.name,
              value: term.code ?? term.name,
            }))}
            loading={termsQuery.isLoading}
            disabled={!isEligible}
          />

          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending}
            disabled={!isEligible || !formState.isValid}
          >
            Gửi đăng ký
          </Button>
        </Form>
      </SectionCard>
    </div>
  );
}
