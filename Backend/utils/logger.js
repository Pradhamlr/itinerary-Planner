const formatPayload = (payload) => {
  if (!payload) {
    return '';
  }

  try {
    return ` ${JSON.stringify(payload)}`;
  } catch (error) {
    return ' [unserializable payload]';
  }
};

const log = (level, message, payload) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}${formatPayload(payload)}`;

  if (level === 'ERROR') {
    console.error(line);
    return;
  }

  if (level === 'WARN') {
    console.warn(line);
    return;
  }

  console.log(line);
};

module.exports = {
  info: (message, payload) => log('INFO', message, payload),
  warn: (message, payload) => log('WARN', message, payload),
  error: (message, payload) => log('ERROR', message, payload),
};
