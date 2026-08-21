export interface QualityGateStep {
  readonly label: string;
  readonly run: () => void;
}

export interface QualityGateOutput {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

export type QualityGateResult =
  | { status: "passed" }
  | { status: "failed"; failedStep: string };

const terminalOutput: QualityGateOutput = {
  stdout: text => process.stdout.write(text),
  stderr: text => process.stderr.write(text),
};

function getProcessOutput(value: unknown): string {
  if (Buffer.isBuffer(value)) return value.toString();
  return typeof value === "string" ? value : "";
}

function getFailureText(error: unknown): string {
  if (error && typeof error === "object" && "stderr" in error) {
    const processError = error as { stderr?: unknown; stdout?: unknown };
    const processOutput = getProcessOutput(processError.stderr) || getProcessOutput(processError.stdout);
    if (processOutput.trim()) return processOutput;
  }

  if (error instanceof Error) return error.message;
  return String(error);
}

export function runQualityGateSteps(
  steps: readonly QualityGateStep[],
  output: QualityGateOutput = terminalOutput,
): QualityGateResult {
  for (const step of steps) {
    output.stdout(`  ${step.label.padEnd(30, ".")} `);

    try {
      step.run();
      output.stdout("ok\n");
    } catch (error: unknown) {
      output.stdout("FAILED\n");
      getFailureText(error)
        .split("\n")
        .filter(Boolean)
        .slice(0, 20)
        .forEach(line => output.stderr(`      ${line}\n`));

      return { status: "failed", failedStep: step.label };
    }
  }

  return { status: "passed" };
}
