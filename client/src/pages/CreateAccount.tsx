import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema, type CreateAccountRequest } from "@shared/schema";
import { useCreateAccount } from "@/hooks/use-accounts";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui-custom";
import { Loader2, Rocket, Building2, Phone, FileText, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatDocument, validateDocument } from "@/lib/document-validation";

export default function CreateAccount() {
  const { mutateAsync, isPending } = useCreateAccount();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cnpj');

  const form = useForm<CreateAccountRequest>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: "",
      slug: "",
      document: "",
      documentType: "cnpj",
      phone: "",
    },
  });

  const documentValue = form.watch('document') || '';

  const documentValidation = useMemo(() => {
    if (!documentValue || documentValue.replace(/\D/g, '').length === 0) {
      return { valid: true };
    }
    return validateDocument(documentValue, documentType);
  }, [documentValue, documentType]);

  const onSubmit = async (data: CreateAccountRequest) => {
    if (!documentValidation.valid) {
      return;
    }
    try {
      await mutateAsync({ ...data, documentType });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Organização</CardTitle>
          <p className="text-muted-foreground mt-2">
            Bem-vindo, {user?.firstName || 'usuário'}! Configure sua organização para começar.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Nome da Organização
              </label>
              <Input
                placeholder="Minha Empresa Ltda"
                {...form.register("name")}
                className="h-12"
                data-testid="input-org-name"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Documento (CPF/CNPJ)
              </label>
              <div className="flex gap-2">
                <select
                  value={documentType}
                  onChange={(e) => {
                    setDocumentType(e.target.value as 'cpf' | 'cnpj');
                    form.setValue('document', '');
                  }}
                  className="h-12 px-3 rounded-lg border border-input bg-background text-sm"
                  data-testid="select-document-type"
                >
                  <option value="cnpj">CNPJ</option>
                  <option value="cpf">CPF</option>
                </select>
                <div className="relative flex-1">
                  <Input
                    placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    value={documentValue}
                    onChange={(e) => form.setValue('document', formatDocument(e.target.value, documentType))}
                    className={`h-12 font-mono pr-10 ${!documentValidation.valid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    data-testid="input-document"
                  />
                  {!documentValidation.valid && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" data-testid="icon-document-error" />
                  )}
                </div>
              </div>
              {!documentValidation.valid && documentValidation.error && (
                <p className="text-red-500 text-sm flex items-center gap-1" data-testid="text-document-error">
                  {documentValidation.error}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefone
              </label>
              <Input
                placeholder="(11) 99999-9999"
                value={form.watch('phone') || ''}
                onChange={(e) => form.setValue('phone', formatPhone(e.target.value))}
                className="h-12 font-mono"
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (Opcional)</label>
              <Input
                placeholder="minha-empresa"
                {...form.register("slug")}
                className="h-12"
                data-testid="input-slug"
              />
              <p className="text-xs text-muted-foreground">Identificador único para a URL da sua organização.</p>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={isPending || !documentValidation.valid} data-testid="button-create">
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              Criar Organização
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Sua organização será criada e estará pronta para uso imediatamente.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
