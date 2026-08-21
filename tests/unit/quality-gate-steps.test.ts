import { describe, expect, it } from "vitest";

import { runQualityGateSteps, type QualityGateOutput, type QualityGateStep } from "../../scripts/quality-gate-steps.js";

function createOutput(): QualityGateOutput & { stdoutLines: string[]; stderrLines: string[] } {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  return {
    stdoutLines,
    stderrLines,
    stdout: text => stdoutLines.push(text),
    stderr: text => stderrLines.push(text),
  };
}

describe("runQualityGateSteps", () => {
  it("stops at the first failed step and keeps its failure text", () => {
    const output = createOutput();
    const executed: string[] = [];
    const steps: QualityGateStep[] = [
      { label: "First prerequisite", run: () => executed.push("first") },
      {
        label: "Failing prerequisite",
        run: () => {
          executed.push("failing");
          throw new Error("the prerequisite output explains the failure");
        },
      },
      { label: "Later step", run: () => executed.push("later") },
    ];

    const result = runQualityGateSteps(steps, output);

    expect(result).toEqual({ status: "failed", failedStep: "Failing prerequisite" });
    expect(executed).toEqual(["first", "failing"]);
    expect(output.stdoutLines.join("")).not.toContain("Later step");
    expect(output.stderrLines.join("")).toContain("the prerequisite output explains the failure");
  });

  it("runs every step when all prerequisites pass", () => {
    const output = createOutput();
    const executed: string[] = [];

    const result = runQualityGateSteps(
      [
        { label: "First step", run: () => executed.push("first") },
        { label: "Second step", run: () => executed.push("second") },
      ],
      output,
    );

    expect(result).toEqual({ status: "passed" });
    expect(executed).toEqual(["first", "second"]);
    expect(output.stdoutLines.join("")).toContain("ok\n");
  });

  it("reports child-process output instead of the generic command error", () => {
    const output = createOutput();
    const childError = Object.assign(new Error("Command failed"), {
      stderr: Buffer.alloc(0),
      stdout: Buffer.from("CHILD_DIAGNOSTIC\n"),
    });

    runQualityGateSteps(
      [{ label: "Child process", run: () => { throw childError; } }],
      output,
    );

    expect(output.stderrLines.join("")).toContain("CHILD_DIAGNOSTIC");
    expect(output.stderrLines.join("")).not.toContain("Command failed");
  });
});
