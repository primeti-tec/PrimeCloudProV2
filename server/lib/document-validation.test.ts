import { describe, it, expect } from "vitest";
import {
  isValidCPF,
  isValidCNPJ,
  validateDocument,
} from "./document-validation";

describe("Server-side document validation - isValidCPF", () => {
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

describe("Server-side document validation - isValidCNPJ", () => {
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

describe("Server-side document validation - validateDocument", () => {
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

  describe("Parity with client-side validation", () => {
    it("should produce identical results for CPF validation", () => {
      const testCases = [
        "12345678909",
        "11144477735",
        "123.456.789-09",
        "12345678900",
        "",
        "123",
      ];

      testCases.forEach((cpf) => {
        const result = validateDocument(cpf, "cpf");
        expect(result).toMatchSnapshot();
      });
    });

    it("should produce identical results for CNPJ validation", () => {
      const testCases = [
        "11222333000181",
        "11444777000161",
        "11.222.333/0001-81",
        "11222333000182",
        "",
        "1122233",
      ];

      testCases.forEach((cnpj) => {
        const result = validateDocument(cnpj, "cnpj");
        expect(result).toMatchSnapshot();
      });
    });
  });
});
