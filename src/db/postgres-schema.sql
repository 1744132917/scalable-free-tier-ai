CREATE TABLE IF NOT EXISTS tenant_usage (
  tenant_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  cost_usd NUMERIC(12,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, request_id)
);

CREATE TABLE IF NOT EXISTS embeddings (
  tenant_id TEXT NOT NULL,
  doc_id TEXT NOT NULL,
  text TEXT NOT NULL,
  embedding JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, doc_id)
);

CREATE INDEX IF NOT EXISTS idx_embeddings_tenant ON embeddings(tenant_id);
