import WebpackDevServerUtils from 'react-dev-utils/WebpackDevServerUtils.js';

const { choosePort } = WebpackDevServerUtils;

export default async function setPorts() {
  const host = process.env.HOST || 'localhost';
  const serverPort = Number.parseInt(process.env.PORT, 10) || 3000;
  const clientPort =
    Number.parseInt(process.env.PORT_DEV, 10) || serverPort + 1;
  const availableServerPort = await choosePort(host, serverPort);
  const availableClientPort = await choosePort(host, clientPort);

  if (!availableServerPort || !availableClientPort) {
    throw new Error('Unable to find available development ports.');
  }

  process.env.PORT = String(availableServerPort);
  process.env.PORT_DEV = String(availableClientPort);
}
