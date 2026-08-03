function normalizeRule(rule) {
  if (rule === true || rule === 'required') return { required: true };
  if (rule instanceof RegExp) return { pattern: rule };
  if (typeof rule === 'function') return { validate: rule };
  return rule || {};
}

function validateRule(name, value, inputRule) {
  const rule = normalizeRule(inputRule);
  const missing = value == null || value === '';
  if (rule.required && missing) return 'is required';
  if (missing) return null;

  if (rule.pattern) {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(value)) return 'has an invalid format';
  }
  if (rule.choices && !rule.choices.includes(value)) {
    return `must be one of: ${rule.choices.join(', ')}`;
  }
  if (rule.validate) {
    const result = rule.validate(value, name);
    if (result === false) return 'is invalid';
    if (typeof result === 'string') return result;
  }
  return null;
}

function validateEnvironment(schema, values = process.env) {
  const errors = [];
  const environment = {};
  for (const [name, rule] of Object.entries(schema || {})) {
    const value = values[name];
    const error = validateRule(name, value, rule);
    if (error) errors.push(`${name} ${error}`);
    if (value != null) environment[name] = value;
  }
  if (errors.length) {
    throw new Error(
      `Invalid Ness environment:\n${errors.map(error => `- ${error}`).join('\n')}`,
    );
  }
  return Object.freeze(environment);
}

function env(options = {}) {
  return {
    name: 'ness:env',
    enforce: 'pre',
    configResolved(config) {
      validateEnvironment(options.schema, {
        ...process.env,
        ...(config.env || {}),
        ...(options.values || {}),
      });
    },
  };
}

function install(config, options = {}) {
  validateEnvironment(options.schema, {
    ...process.env,
    ...(options.values || {}),
  });
  return config;
}

export { env, install, validateEnvironment };
export default env;
