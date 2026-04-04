import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, message } from "antd";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { FormInput } from "../../components/forms/FormInput";
import { FormSelect } from "../../components/forms/FormSelect";
import { createBctt } from "../../services/registrations.api";
import { getTerms } from "../../services/terms.api";
import { getLecturers, getMyFields } from "../../services/users.api";
import { getErrorMessage } from "../../utils/errors";
import { queryKeys } from "../../utils/query-keys";

const registerBcttSchema = z.object({
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

type RegisterBcttValues = z.infer<typeof registerBcttSchema>;

export default function StudentRegisterBcttPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState } = useForm<RegisterBcttValues>({
    resolver: zodResolver(registerBcttSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      fieldName: "",
      companyName: "",
      supervisorId: "",
      termId: "",
    },
  });

  const selectedField = useWatch({ control, name: "fieldName" });

  const termsQuery = useQuery({
    queryKey: queryKeys.terms({ loai: "BCTT", isActive: true }),
    queryFn: () => getTerms({ loai: "BCTT", isActive: true }),
  });

  const fieldsQuery = useQuery({
    queryKey: queryKeys.myFields,
    queryFn: getMyFields,
  });

  const lecturersQuery = useQuery({
    queryKey: queryKeys.lecturers({ fieldName: selectedField }),
    queryFn: () => getLecturers({ fieldName: selectedField }),
    enabled: Boolean(selectedField),
  });

  const createMutation = useMutation({
    mutationFn: createBctt,
    onSuccess: () => {
      message.success("Đăng ký BCTT thành công.");
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
        title="Đăng ký BCTT"
        subtitle="Chọn lĩnh vực từ danh sách theo chuyên ngành của bạn, sau đó chọn đợt và giảng viên phù hợp."
      />

      <SectionCard title="Biểu mẫu đăng ký">
        <Form
          layout="vertical"
          onFinish={handleSubmit((values) => createMutation.mutate(values))}
        >
          <FormInput
            control={control}
            name="title"
            label="Tên đề tài"
            placeholder="Ví dụ: Xây dựng hệ thống quản lý đề tài"
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
          />
          <FormInput
            control={control}
            name="companyName"
            label="Công ty"
            placeholder="Tên doanh nghiệp thực tập"
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
            disabled={!selectedField}
          />
          <FormSelect
            control={control}
            name="termId"
            label="Đợt"
            placeholder="Chọn đợt active"
            options={(termsQuery.data ?? []).map((term) => ({
              label: term.name,
              value: term.code ?? term.name,
            }))}
            loading={termsQuery.isLoading}
          />

          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending}
            disabled={!formState.isValid}
          >
            Gửi đăng ký
          </Button>
        </Form>
      </SectionCard>
    </div>
  );
}
