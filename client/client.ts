import { createPublicClient, http, webSocket } from 'viem';
import { base } from 'viem/chains';
import { retrieveEnvVariable, logger } from '../utils';

const NODE_RUNNING = retrieveEnvVariable('NODE_RUNNING', logger) === 'true';
const RPC_ENDPOINT = NODE_RUNNING ? retrieveEnvVariable('NODE_RPC_ENDPOINT', logger) : retrieveEnvVariable('RPC_ENDPOINT', logger);
const WS_ENDPOINT = NODE_RUNNING ? retrieveEnvVariable('NODE_WS_ENDPOINT', logger) : retrieveEnvVariable('WS_ENDPOINT', logger);

const transportRPC = http(RPC_ENDPOINT);
const transportWS = webSocket(WS_ENDPOINT);

export const clientRPC = createPublicClient({
    chain: base,
    transport: transportRPC,
});
export const clientWS = createPublicClient({
    chain: base,
    transport: transportWS,
});