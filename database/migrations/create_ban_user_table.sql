-- Migration: Create ban_user table
-- Description: Store banned bidders for specific products

CREATE TABLE IF NOT EXISTS ban_user (
    ban_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    bidder_id INT NOT NULL,
    banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    UNIQUE(product_id, bidder_id) -- Prevent duplicate bans
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ban_user_product_bidder ON ban_user(product_id, bidder_id);

-- Comments
COMMENT ON TABLE ban_user IS 'Tracks bidders banned from specific auction products';
COMMENT ON COLUMN ban_user.product_id IS 'ID of the product the bidder is banned from';
COMMENT ON COLUMN ban_user.bidder_id IS 'ID of the banned bidder';
COMMENT ON COLUMN ban_user.banned_at IS 'Timestamp when the ban was applied';