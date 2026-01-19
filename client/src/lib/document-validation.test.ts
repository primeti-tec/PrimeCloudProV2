import { describe, it, expect } from "vitest";
import {
  isValidCPF,
  isValidCNPJ,
  formatCPF,
  formatCNPJ,
  formatDocument,
  validateDocument,
} from "./document-validation";

describe("isValidCPF", () => {
  it("should validate a correct CPF", () => {
    expect(isValidCPF("12345678909")).toBe(true);
    expect(isValidCPF("11144477735")).toBe(true);
  });

  it("should validate CPF with formatting", () => {
    expect(isValidCPF("123.456.789-09")).toBe(true);
    expect(isValidCPF("111.444.777-35")).toBe(true);
  });

  it("should reject CPF with wrong length", () => {
    expect(isValidCPF("123456789")).toBe(false);
    expect(isValidCPF("123456789012")).toBe(false);
  });

  it("should reject CPF with all same digits", () => {
    expect(isValidCPF("11111111111")).toBe(false);
    expect(isValidCPF("00000000000")).toBe(false);
    expect(isValidCPF("99999999999")).toBe(false);
  });

  it("should reject CPF with invalid check digits", () => {
    expect(isValidCPF("12345678900")).toBe(false);
    expect(isValidCPF("11144477736")).toBe(false);
  });

  it("should handle empty string", () => {
    expect(isValidCPF("")).toBe(false);
  });

  it("should handle non-numeric characters", () => {
    expect(isValidCPF("abc.def.ghi-jk")).toBe(false);
  });
});

describe("isValidCNPJ", () => {
  it("should validate a correct CNPJ", () => {
    expect(isValidCNPJ("11222333000181")).toBe(true);
    expect(isValidCNPJ("11444777000161")).toBe(true);
  });

  it("should validate CNPJ with formatting", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.444.777/0001-61")).toBe(true);
  });

  it("should reject CNPJ with wrong length", () => {
    expect(isValidCNPJ("1122233300018")).toBe(false);
    expect(isValidCNPJ("112223330001811")).toBe(false);
  });

  it("should reject CNPJ with all same digits", () => {
    expect(isValidCNPJ("11111111111111")).toBe(false);
    expect(isValidCNPJ("00000000000000")).toBe(false);
    expect(isValidCNPJ("99999999999999")).toBe(false);
  });

  it("should reject CNPJ with invalid check digits", () => {
    expect(isValidCNPJ("11222333000182")).toBe(false);
    expect(isValidCNPJ("11444777000162")).toBe(false);
  });

  it("should handle empty string", () => {
    expect(isValidCNPJ("")).toBe(false);
  });

  it("should handle non-numeric characters", () => {
    expect(isValidCNPJ("ab.cde.fgh/ijkl-mn")).toBe(false);
  });
});

describe("formatCPF", () => {
  it("should format a valid CPF", () => {
    expect(formatCPF("12345678909")).toBe("123.456.789-09");
    expect(formatCPF("11144477735")).toBe("111.444.777-35");
  });

  it("should handle already formatted CPF", () => {
    expect(formatCPF("123.456.789-09")).toBe("123.456.789-09");
  });

  it("should handle partial CPF input", () => {
    expect(formatCPF("123")).toBe("123");
    expect(formatCPF("123456")).toBe("123.456");
    expect(formatCPF("123456789")).toBe("123.456.789");
  });

  it("should truncate extra digits", () => {
    expect(formatCPF("123456789091234")).toBe("123.456.789-09");
  });

  it("should handle empty string", () => {
    expect(formatCPF("")).toBe("");
  });

  it("should strip non-numeric characters", () => {
    expect(formatCPF("abc123def456ghi789jk09")).toBe("123.456.789-09");
  });
});

describe("formatCNPJ", () => {
  it("should format a valid CNPJ", () => {
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatCNPJ("11444777000161")).toBe("11.444.777/0001-61");
  });

  it("should handle already formatted CNPJ", () => {
    expect(formatCNPJ("11.222.333/0001-81")).toBe("11.222.333/0001-81");
  });

  it("should handle partial CNPJ input", () => {
    expect(formatCNPJ("11")).toBe("11");
    expect(formatCNPJ("11222")).toBe("11.222");
    expect(formatCNPJ("11222333")).toBe("11.222.333");
    expect(formatCNPJ("11222333000")).toBe("11.222.333/000");
  });

  it("should truncate extra digits", () => {
    expect(formatCNPJ("112223330001811234")).toBe("11.222.333/0001-81");
  });

  it("should handle empty string", () => {
    expect(formatCNPJ("")).toBe("");
  });

  it("should strip non-numeric characters", () => {
    expect(formatCNPJ("ab11cd222ef333gh0001ij81")).toBe("11.222.333/0001-81");
  });
});

describe("formatDocument", () => {
  it("should format CPF when type is cpf", () => {
    expect(formatDocument("12345678909", "cpf")).toBe("123.456.789-09");
  });

  it("should format CNPJ when type is cnpj", () => {
    expect(formatDocument("11222333000181", "cnpj")).toBe("11.222.333/0001-81");
  });
});

describe("validateDocument", () => {
  describe("CPF validation", () => {
    it("should validate a correct CPF", () => {
      const result = validateDocument("12345678909", "cpf");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty document", () => {
      const result = validateDocument("", "cpf");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Document is required");
    });

    it("should reject CPF with less than 11 digits", () => {
      const result = validateDocument("123456789", "cpf");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("CPF must have 11 digits");
    });

    it("should reject invalid CPF", () => {
      const result = validateDocument("12345678900", "cpf");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid CPF");
    });

    it("should validate CPF with formatting", () => {
      const result = validateDocument("123.456.789-09", "cpf");
      expect(result.valid).toBe(true);
    });
  });

  describe("CNPJ validation", () => {
    it("should validate a correct CNPJ", () => {
      const result = validateDocument("11222333000181", "cnpj");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty document", () => {
      const result = validateDocument("", "cnpj");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Document is required");
    });

    it("should reject CNPJ with less than 14 digits", () => {
      const result = validateDocument("1122233300018", "cnpj");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("CNPJ must have 14 digits");
    });

    it("should reject invalid CNPJ", () => {
      const result = validateDocument("11222333000182", "cnpj");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid CNPJ");
    });

    it("should validate CNPJ with formatting", () => {
      const result = validateDocument("11.222.333/0001-81", "cnpj");
      expect(result.valid).toBe(true);
    });
  });
});
