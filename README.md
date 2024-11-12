# bot-sync
```markdown
# Ping-Pong Bot

This bot monitors a contract at `0xA7F42ff7433cB268dD7D59be62b00c30dEd28d3D` (Sepolia) for `Ping()` events and responds with `pong()` transactions.

## Bot Details
- **Bot Address**: 0xEDbaE649efbCb56979C30a32701b1fE801168B74
- **Starting Block**: 7035885
- **GraphQL Endpoint**: https://your-app-url:42069/graphql

## Features
- Automatically responds to Ping events with Pong transactions
- Handles gas price spikes
- Implements rate limiting
- Manages network failures
- Tracks transaction status
- Retries failed transactions
- Maintains transaction history

## Transaction Status Types
- `pending`: Initial state when Ping is detected
- `sending_pong`: Pong transaction is being sent
- `pong_sent`: Pong transaction sent, awaiting confirmation
- `completed`: Successfully processed
- `failed`: Failed to process
- `gas_too_high`: Transaction delayed due to high gas prices
- `network_error`: Network connectivity issues

## Query Examples

### Get All Processed Transactions
```graphql
{
  processedPings {
    id              # Ping transaction hash
    blockNumber     # Block where Ping was detected
    timestamp       # Processing timestamp
    status         # Current status
    pongTxHash     # Response transaction hash
  }
}
```

### Get Specific Transaction
example hash to try : 0x7f46753bc6c5e0159961b5f727fb07cf445d2e2c972f44eaeff61a933842079c
```graphql
{
  processedPing(id: "0xtransaction_hash_here") {
    id
    blockNumber
    timestamp
    status
    pongTxHash
    gasPrice      
    nonce        
    retryCount   
    lastError
  }
}
```

### Get Transactions by Status
```graphql
{
  processedPings({ status: "completed" }) {
    id
    blockNumber
    pongTxHash
  }
}
```

### Using cURL
```bash
# Query all transactions
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ processedPings { id status pongTxHash } }"}' \
  https://your-app-url:42069/graphql

# Query specific transaction
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ processedPing(id: \"0xyour_tx_hash\") { id status pongTxHash } }"}' \
  https://your-app-url:42069/graphql
```



## Error Handling
The bot implements comprehensive error handling:
- Retries failed transactions up to 3 times
- Tracks gas prices to avoid expensive transactions
- Implements rate limiting to prevent API overload
- Recovers from network failures
- Maintains transaction status history

## Monitoring
You can monitor the bot's activity by:
1. Querying the GraphQL endpoint for recent transactions
2. Checking transaction statuses
3. Viewing error messages for failed transactions
4. Tracking Ping-Pong pairs through transaction hashes

## Common Use Cases
1. **Verify Ping-Pong Pairs**:
   - Get a Ping transaction
   - Query its corresponding Pong response
   - Check completion status

2. **Monitor Bot Health**:
   - Check recent transaction statuses
   - Look for failed transactions
   - Monitor response times

3. **Audit Trail**:
   - Track all Ping events
   - Verify Pong responses
   - Review error cases

## Support
For issues or questions, please open a GitHub issue or contact the maintainers.
```

This README:
1. Explains the bot's purpose
2. Shows how to query data
3. Provides working examples
4. Documents status codes
5. Explains error handling
6. Shows common use cases

