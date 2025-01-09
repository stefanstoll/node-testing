import { createPublicClient, http, webSocket } from 'viem';
import { base } from 'viem/chains';
import { retrieveEnvVariable, logger } from '../utils';

const NODE_RUNNING = retrieveEnvVariable('NODE_RUNNING', logger) === 'true';
const RPC_ENDPOINT = NODE_RUNNING ? retrieveEnvVariable('NODE_RPC_ENDPOINT', logger) : retrieveEnvVariable('RPC_ENDPOINT', logger);
const WS_ENDPOINT = NODE_RUNNING ? retrieveEnvVariable('NODE_WS_ENDPOINT', logger) : retrieveEnvVariable('WS_ENDPOINT', logger);
const TENDERLY_WS_ENDPOINT = retrieveEnvVariable('TENDERLY_WS_ENDPOINT', logger);
const QUICKNODE_WS_ENDPOINT = retrieveEnvVariable('QUICKNODE_WS_ENDPOINT', logger);
const ANKR_WS_ENDPOINT = retrieveEnvVariable('ANKR_WS_ENDPOINT', logger);

const transportRPC = http(RPC_ENDPOINT);
const transportWS = webSocket(WS_ENDPOINT);
const transportTenderlyWS = webSocket(TENDERLY_WS_ENDPOINT);
const transportQuicknodeWS = webSocket(QUICKNODE_WS_ENDPOINT);
const transportAnkrWS = webSocket(ANKR_WS_ENDPOINT);

export const clientRPC = createPublicClient({
    chain: base,
    transport: transportRPC,
});
export const clientWS = createPublicClient({
    chain: base,
    transport: transportWS,
});
export const clientTenderlyWS = createPublicClient({
    chain: base,
    transport: transportTenderlyWS,
});
export const clientQuicknodeWS = createPublicClient({
    chain: base,
    transport: transportQuicknodeWS,
});
export const clientAnkrWS = createPublicClient({
    chain: base,
    transport: transportAnkrWS,
});
