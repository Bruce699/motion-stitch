import { z } from "zod";

const common = {
  label: z.string().min(1).max(100),
  group: z.string().min(1).max(80).optional(),
};
const range = {
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().finite().positive().default(0.01),
  unit: z.string().max(12).optional(),
};
const vector = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);
export const ParameterValueSchema = z.union([
  z.number().finite(),
  z.string(),
  z.boolean(),
  vector,
]);
export type ParameterValue = z.infer<typeof ParameterValueSchema>;
export type ParameterValues = Record<string, ParameterValue>;

// Existing numeric scene documents remain valid without a type field.
export const ParameterSchema = z.preprocess(
  (p) => (p && typeof p === "object" ? { type: "number", ...p } : p),
  z
    .discriminatedUnion("type", [
      z.object({
        ...common,
        ...range,
        type: z.literal("number"),
        value: z.number().finite(),
        control: z.enum(["slider", "number"]).default("slider"),
      }),
      z.object({
        ...common,
        type: z.literal("color"),
        value: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      }),
      z.object({ ...common, type: z.literal("boolean"), value: z.boolean() }),
      z.object({
        ...common,
        type: z.literal("select"),
        value: z.string(),
        options: z
          .array(
            z.object({ label: z.string().min(1), value: z.string().min(1) }),
          )
          .min(1)
          .max(100),
      }),
      z.object({
        ...common,
        ...range,
        type: z.literal("vector3"),
        value: vector,
      }),
    ])
    .superRefine((p, ctx) => {
      if (p.type === "number" || p.type === "vector3") {
        const values = p.type === "number" ? [p.value] : p.value;
        if (p.min >= p.max || values.some((v) => v < p.min || v > p.max))
          ctx.addIssue({
            code: "custom",
            message: "Parameter value must be inside its range",
          });
      }
      if (
        p.type === "select" &&
        (new Set(p.options.map((o) => o.value)).size !== p.options.length ||
          !p.options.some((o) => o.value === p.value))
      )
        ctx.addIssue({
          code: "custom",
          message: "Choice values must be unique and include the current value",
        });
    }),
);
export type Parameter = z.infer<typeof ParameterSchema>;

export function withParameterValue(
  parameter: Parameter,
  value: unknown,
): Parameter {
  return ParameterSchema.parse({ ...parameter, value });
}

/** Typed scene access; errors point to the declaration instead of failing in shader math. */
export function parameterReader(parameters: Record<string, Parameter>) {
  function read<T extends Parameter["type"]>(
    key: string,
    type: T,
  ): Extract<Parameter, { type: T }> {
    const p = parameters[key];
    if (!p || p.type !== type)
      throw new Error(`Parameter ${key} must be declared as ${type}`);
    return p as Extract<Parameter, { type: T }>;
  }
  return {
    number: (key: string) => read(key, "number").value,
    color: (key: string) => read(key, "color").value,
    boolean: (key: string) => read(key, "boolean").value,
    select: (key: string) => read(key, "select").value,
    vector3: (key: string) => read(key, "vector3").value,
  };
}
export type ParameterReader = ReturnType<typeof parameterReader>;

export function parameterGroups(parameters: Record<string, Parameter>) {
  const groups = new Map<string, { key: string; parameter: Parameter }[]>();
  for (const [key, parameter] of Object.entries(parameters)) {
    const name = parameter.group || "";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push({ key, parameter });
  }
  return [...groups].map(([name, entries]) => ({ name, entries }));
}

export function parseParameterArgument(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
