# MRT Multi-App Integration: Deploy & Env Vars

This branch wires Mission Ready Transport (MRT) to talk to Pathways, Housing, the
booking website (`mrt-connect`), and Google Drive. Every outbound call is
standalone-safe: failures get queued in `OutboundIntegrationQueue` and retried by
`retryFailedIntegrations`. Every inbound call requires an `idempotency_key` and
records an `IncomingBookingEvent` for dedup.

## 1. Required env vars

| Name | Used by | Notes |
|---|---|---|
| `BASE44_APP_ID` | All service-role functions | The MRT Base44 app id |
| `BASE44_SERVICE_ROLE_KEY` | All service-role functions | Service role key (NOT user-bound) |
| `MRT_FUNCTIONS_BASE_URL` | `transportApi`, `autoAssignmentEngine`, `generateDocumentFromTemplate` | Base URL of MRT functions, e.g. `https://mrt.base44.app` |
| `PATHWAYS_APP_BASE_URL` | `notifyPathwaysOfTrip`, `notifyPathwaysOfIncident`, `retryFailedIntegrations` | Override via `IntegrationConfig` row |
| `HOUSING_APP_BASE_URL` | `notifyHousingOfTransport`, `retryFailedIntegrations` | Override via `IntegrationConfig` row |
| `DRIVE_APP_BASE_URL` | `retryFailedIntegrations` | Optional |
| `MRT_OUTBOUND_SECRET` | All outbound notifiers | Sent as `x-mrt-secret`. Peers must accept it. |
| `PATHWAYS_INBOUND_SECRET` | `receiveTripRequestFromPathways` | Required header `x-pathways-secret` |
| `MRT_WEBSITE_INBOUND_SECRET` | `receiveBookingFromWebsite` | Required header `x-mrt-website-secret` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `googleDriveService` | Service account email |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `googleDriveService` | PEM, escaped newlines OK |

## 2. Deploy order

1. Push entities first (Base44 will pick up new properties + new entities). The
   migration on existing entities is additive only.
2. Push functions.
3. Set env vars in Base44 dashboard (Functions > Environment).
4. Create one `IntegrationConfig` row per peer (`pathways`, `housing`, `drive`,
   `mrt_website`) with `enabled=true` and `base_url` if you want to override env.
5. Schedule `retryFailedIntegrations` every 1-5 minutes.

## 3. Standalone-safe behavior

- If `MRT_FUNCTIONS_BASE_URL` is unset, `transportApi` and `autoAssignmentEngine`
  silently skip the fire-and-forget notify. MRT keeps working.
- If `PATHWAYS_APP_BASE_URL` (or housing) is unset OR the IntegrationConfig is
  disabled, the notifier returns success and queues nothing extra.
- If the peer is reachable but errors, the request is enqueued in
  `OutboundIntegrationQueue` for retry. MRT never throws.

## 4. Idempotency contracts

- Every inbound REQUIRES `idempotency_key` in the body.
- `IncomingBookingEvent.idempotency_key` is unique-indexed; replays are deduped
  and return the original `transport_request_id`.
- Outbound notifies build deterministic keys like `mrt-trip-<trip_id>-<status>`
  so peers can dedup on their side too.

## 5. Endpoint contracts (MRT side)

### Inbound

- `POST /functions/receiveTripRequestFromPathways`  
  Header `x-pathways-secret`. Body:
  `{ global_resident_id, pickup, dropoff, requested_at, urgency, special_needs, idempotency_key, pathways_request_id? }`

- `POST /functions/receiveBookingFromWebsite`  
  Header `x-mrt-website-secret`. Body:
  `{ idempotency_key, first_name, last_name, phone, email, pickup_location, dropoff_location, pickup_time?, request_date?, service_type?, purpose?, priority?, special_instructions?, external_request_id? }`

### Outbound (called from MRT)

- Pathways `POST /functions/receiveTripFromMRT` header `x-mrt-secret`
- Pathways `POST /functions/receiveIncidentFromMRT` header `x-mrt-secret`
- Housing `POST /functions/receiveTransportArrivalNotice` header `x-mrt-secret`

## 6. Drive folder convention

`MRT/Trips/<YYYY-MM-DD>/<trip_id>/<doc_type>/<file>`

## 7. Rollback

- The added Participant / TransportRequest / Incident fields are all optional.
  Removing the wiring (revert `transportApi` and `autoAssignmentEngine`) returns
  MRT to standalone behavior with no data loss.
- New entities are isolated; dropping them does not break existing reads.
