import { describe, it, expect } from "vitest";
import { initials, vaccinationStatus, formatPercent, formatNumber } from "../utils";

describe("initials", () => {
  it("returns first letters of first two words", () => {
    expect(initials("Refilwe Sengate")).toBe("RS");
  });

  it("handles single name", () => {
    expect(initials("Kabo")).toBe("K");
  });

  it("handles three+ names, takes first two", () => {
    expect(initials("Dr Thabo Mogale")).toBe("DT");
  });

  it("uppercases lowercase input", () => {
    expect(initials("john doe")).toBe("JD");
  });
});

describe("vaccinationStatus", () => {
  it("returns 'No schedule' for null due date", () => {
    const result = vaccinationStatus(null);
    expect(result.label).toBe("No schedule");
    expect(result.className).toBe("badge-muted");
  });

  it("returns 'Overdue' for past due date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = vaccinationStatus(yesterday.toISOString().split("T")[0]);
    expect(result.label).toBe("Overdue");
    expect(result.className).toBe("badge-red");
  });

  it("returns 'Due soon' for date within 14 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const result = vaccinationStatus(soon.toISOString().split("T")[0]);
    expect(result.label).toBe("Due soon");
    expect(result.className).toBe("badge-amber");
  });

  it("returns 'Compliant' for date more than 14 days out", () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const result = vaccinationStatus(future.toISOString().split("T")[0]);
    expect(result.label).toBe("Compliant");
    expect(result.className).toBe("badge-green");
  });
});

describe("formatPercent", () => {
  it("formats without decimals by default", () => {
    expect(formatPercent(85)).toBe("85%");
  });

  it("formats with specified decimals", () => {
    expect(formatPercent(85.5, 1)).toBe("85.5%");
  });
});

describe("formatNumber", () => {
  it("formats a plain number", () => {
    expect(formatNumber(1000)).toMatch(/1.000|1,000/);
  });
});

// ── Risk scoring logic (mirrors get_predictive_risk SQL rules) ────

describe("risk scoring rules", () => {
  // These test the DOCUMENTED rules, not the SQL directly.
  // Documented in CLAUDE.md and the migration:
  //   High: overdue vaccination + recent disease/injury event in last 90 days
  //   Medium: overdue vaccination OR owner coverage below 80%
  //   Low: everything else

  interface AnimalRiskInput {
    hasOverdueVaccination: boolean;
    hasRecentDiseaseEvent: boolean; // within 90 days
    ownerCoveragePct: number;
  }

  function computeRiskLevel(input: AnimalRiskInput): "high" | "medium" | "low" {
    if (input.hasOverdueVaccination && input.hasRecentDiseaseEvent) return "high";
    if (input.hasOverdueVaccination || input.ownerCoveragePct < 80) return "medium";
    return "low";
  }

  it("HIGH: overdue vaccination + recent disease event", () => {
    expect(
      computeRiskLevel({ hasOverdueVaccination: true, hasRecentDiseaseEvent: true, ownerCoveragePct: 50 })
    ).toBe("high");
  });

  it("MEDIUM: overdue vaccination only (no recent disease)", () => {
    expect(
      computeRiskLevel({ hasOverdueVaccination: true, hasRecentDiseaseEvent: false, ownerCoveragePct: 90 })
    ).toBe("medium");
  });

  it("MEDIUM: coverage below 80% (no overdue)", () => {
    expect(
      computeRiskLevel({ hasOverdueVaccination: false, hasRecentDiseaseEvent: false, ownerCoveragePct: 60 })
    ).toBe("medium");
  });

  it("LOW: all vaccinations current and coverage >= 80%", () => {
    expect(
      computeRiskLevel({ hasOverdueVaccination: false, hasRecentDiseaseEvent: false, ownerCoveragePct: 95 })
    ).toBe("low");
  });

  it("HIGH takes precedence over medium conditions", () => {
    expect(
      computeRiskLevel({ hasOverdueVaccination: true, hasRecentDiseaseEvent: true, ownerCoveragePct: 90 })
    ).toBe("high");
  });

  it("MEDIUM: boundary at exactly 80% is NOT medium", () => {
    expect(
      computeRiskLevel({ hasOverdueVaccination: false, hasRecentDiseaseEvent: false, ownerCoveragePct: 80 })
    ).toBe("low");
  });

  it("MEDIUM: boundary at 79% IS medium", () => {
    expect(
      computeRiskLevel({ hasOverdueVaccination: false, hasRecentDiseaseEvent: false, ownerCoveragePct: 79 })
    ).toBe("medium");
  });
});
