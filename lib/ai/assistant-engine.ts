import { agentDirectory, type AgentCode } from "@/lib/agents";
import { generateGeminiAdvisory } from "@/lib/ai/gemini";
import { runtimeStage } from "@/lib/runtime/engine-registry";

export type AssistantEngineRequest = {
  prompt: string;
  requestedAgent?: string;
  userId: string;
};

export function resolveAssistantAgent(requestedAgent?: string) {
  const code = (requestedAgent || "andreaa") as AgentCode;
  const agent = agentDirectory.find((entry) => entry.code === code);
  if (!agent) throw new Error("UNKNOWN_AGENT");
  return agent;
}

export async function runAssistantEngine(input: AssistantEngineRequest) {
  const agent = resolveAssistantAgent(input.requestedAgent);
  const result = await generateGeminiAdvisory({ prompt: input.prompt, agent: agent.code, userId: input.userId });
  return {
    ...result,
    engine: "ai_assistant",
    stage: runtimeStage(),
    agent: {
      code: agent.code,
      name: agent.name,
      discipline: agent.discipline,
      humanReview: agent.humanReview,
    },
    controls: {
      sanitizedInput: true,
      credentialHandling: false,
      humanReviewRequired: true,
      externalCommitmentAllowed: false,
    },
  };
}
