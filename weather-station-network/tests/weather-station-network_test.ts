import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can register a weather station",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('weather-station-network', 'register-weather-station', [
                types.ascii("New York City"),
                types.int(404720), // latitude * 10000
                types.int(-740060), // longitude * 10000
                types.uint(1000000) // stake amount
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
    },
});

Clarinet.test({
    name: "Can submit weather data",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        // First register a station
        let block = chain.mineBlock([
            Tx.contractCall('weather-station-network', 'register-weather-station', [
                types.ascii("New York City"),
                types.int(404720),
                types.int(-740060),
                types.uint(1000000)
            ], wallet1.address)
        ]);
        
        // Then submit weather data
        block = chain.mineBlock([
            Tx.contractCall('weather-station-network', 'submit-weather-data', [
                types.uint(1), // station-id
                types.int(250), // temperature (25.0°C)
                types.uint(65), // humidity
                types.uint(1013), // pressure
                types.uint(15), // wind-speed
                types.uint(180), // wind-direction
                types.uint(5) // rainfall
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    },
});

Clarinet.test({
    name: "Can get station metrics",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        // Register a station
        let block = chain.mineBlock([
            Tx.contractCall('weather-station-network', 'register-weather-station', [
                types.ascii("Test Station"),
                types.int(404720),
                types.int(-740060),
                types.uint(1000000)
            ], wallet1.address)
        ]);
        
        // Get metrics
        let metrics = chain.callReadOnlyFn('weather-station-network', 'get-station-metrics', [
            types.uint(1)
        ], wallet1.address);
        
        assertEquals(metrics.result.expectOk().expectTuple()['data-quality'], types.uint(100));
    },
});

Clarinet.test({
    name: "Can submit emergency alert",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        // Register a station
        let block = chain.mineBlock([
            Tx.contractCall('weather-station-network', 'register-weather-station', [
                types.ascii("Test Station"),
                types.int(404720),
                types.int(-740060),
                types.uint(1000000)
            ], wallet1.address)
        ]);
        
        // Submit emergency alert
        block = chain.mineBlock([
            Tx.contractCall('weather-station-network', 'submit-emergency-alert', [
                types.uint(1),
                types.ascii("SEVERE_STORM"),
                types.uint(4)
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    },
});