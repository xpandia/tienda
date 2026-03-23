/// Tienda — App-Specific Commerce Chain for LATAM on Initia
///
/// A full-featured decentralized marketplace smart contract providing:
///   - Merchant registration and store management
///   - Product listings with rich metadata
///   - Order lifecycle (create, escrow, fulfill, dispute, complete)
///   - Loyalty points (mint, earn on purchase, redeem for discounts)
///   - Escrow-based buyer protection with timeout release
///   - On-chain rating and review system
///
/// Designed for the Initia MoveVM (based on Move language).
/// All monetary values are denominated in the chain's native token (uTIENDA).

module tienda::marketplace {

    use std::string::{Self, String};
    use std::signer;
    use std::vector;
    use std::error;
    use std::option::{Self, Option};
    use initia_std::coin;
    use initia_std::object;
    use initia_std::event;
    use initia_std::timestamp;
    use initia_std::table::{Self, Table};
    use initia_std::fungible_asset::{Self, Metadata};

    // =========================================================================
    // Error codes
    // =========================================================================

    const E_NOT_AUTHORIZED: u64 = 1;
    const E_MERCHANT_ALREADY_REGISTERED: u64 = 2;
    const E_MERCHANT_NOT_FOUND: u64 = 3;
    const E_PRODUCT_NOT_FOUND: u64 = 4;
    const E_INSUFFICIENT_STOCK: u64 = 5;
    const E_ORDER_NOT_FOUND: u64 = 6;
    const E_INVALID_ORDER_STATE: u64 = 7;
    const E_INSUFFICIENT_FUNDS: u64 = 8;
    const E_ESCROW_NOT_RELEASED: u64 = 9;
    const E_ALREADY_REVIEWED: u64 = 10;
    const E_INVALID_RATING: u64 = 11;
    const E_INSUFFICIENT_LOYALTY_POINTS: u64 = 12;
    const E_STORE_NOT_FOUND: u64 = 13;
    const E_ESCROW_TIMEOUT_NOT_REACHED: u64 = 14;
    const E_ZERO_QUANTITY: u64 = 15;
    const E_INVALID_PRICE: u64 = 16;
    const E_SELF_PURCHASE: u64 = 17;
    const E_DISPUTE_WINDOW_EXPIRED: u64 = 18;

    // =========================================================================
    // Constants
    // =========================================================================

    /// Escrow auto-release timeout: 7 days in seconds.
    const ESCROW_TIMEOUT_SECS: u64 = 604800;

    /// Dispute window after delivery confirmation: 3 days in seconds.
    const DISPUTE_WINDOW_SECS: u64 = 259200;

    /// Loyalty points earned per 1_000_000 uTIENDA spent (1 TIENDA = 100 pts).
    const LOYALTY_POINTS_PER_UNIT: u64 = 100;

    /// Base unit for loyalty point calculation.
    const LOYALTY_BASE_UNIT: u64 = 1_000_000;

    /// Maximum rating value (1-5 stars).
    const MAX_RATING: u8 = 5;

    // =========================================================================
    // Order states
    // =========================================================================

    const ORDER_CREATED: u8 = 0;
    const ORDER_PAID: u8 = 1;
    const ORDER_SHIPPED: u8 = 2;
    const ORDER_DELIVERED: u8 = 3;
    const ORDER_COMPLETED: u8 = 4;
    const ORDER_DISPUTED: u8 = 5;
    const ORDER_REFUNDED: u8 = 6;
    const ORDER_CANCELLED: u8 = 7;

    // =========================================================================
    // Core data structures
    // =========================================================================

    /// Global marketplace state, held by the deployer account.
    struct Marketplace has key {
        /// Admin address that can resolve disputes and manage the platform.
        admin: address,
        /// Auto-incrementing counter for merchant IDs.
        next_merchant_id: u64,
        /// Auto-incrementing counter for product IDs.
        next_product_id: u64,
        /// Auto-incrementing counter for order IDs.
        next_order_id: u64,
        /// Map from merchant address to MerchantProfile.
        merchants: Table<address, MerchantProfile>,
        /// Map from product_id to Product.
        products: Table<u64, Product>,
        /// Map from order_id to Order.
        orders: Table<u64, Order>,
        /// Map from order_id to Escrow.
        escrows: Table<u64, Escrow>,
        /// Map from (order_id) to Review.
        reviews: Table<u64, Review>,
        /// Map from user address to LoyaltyAccount.
        loyalty_accounts: Table<address, LoyaltyAccount>,
        /// Platform fee in basis points (e.g. 250 = 2.5%).
        platform_fee_bps: u64,
        /// Accumulated platform fees available for withdrawal.
        platform_fees_collected: u64,
        /// Token metadata for the native payment token.
        payment_token_metadata: Object<Metadata>,
    }

    /// A registered merchant on the platform.
    struct MerchantProfile has store, drop, copy {
        merchant_id: u64,
        owner: address,
        store_name: String,
        description: String,
        /// Country code (ISO 3166-1 alpha-2), e.g. "CO", "MX", "BR".
        country: String,
        /// City or region for local discovery.
        city: String,
        /// Category tags for search (e.g. ["electronics", "clothing"]).
        categories: vector<String>,
        /// Whether the merchant is currently active.
        is_active: bool,
        /// Total number of products listed.
        product_count: u64,
        /// Total number of completed orders.
        total_orders: u64,
        /// Cumulative rating score (sum of all ratings).
        total_rating_score: u64,
        /// Number of ratings received.
        rating_count: u64,
        /// Timestamp of registration.
        registered_at: u64,
    }

    /// A product listing.
    struct Product has store, drop, copy {
        product_id: u64,
        merchant: address,
        name: String,
        description: String,
        /// Price in uTIENDA (smallest denomination).
        price: u64,
        /// Available stock quantity.
        stock: u64,
        /// Category for search/filter.
        category: String,
        /// URI to product image (IPFS or HTTP).
        image_uri: String,
        /// Additional metadata as key-value pairs serialized as JSON string.
        metadata_json: String,
        /// Whether the product is currently listed and available.
        is_active: bool,
        /// Timestamp of creation.
        created_at: u64,
        /// Timestamp of last update.
        updated_at: u64,
    }

    /// An order placed by a buyer.
    struct Order has store, drop, copy {
        order_id: u64,
        buyer: address,
        merchant: address,
        product_id: u64,
        quantity: u64,
        /// Total price = unit_price * quantity at time of order.
        total_price: u64,
        /// Loyalty points redeemed as discount on this order.
        loyalty_discount: u64,
        /// Net amount actually charged (total_price - loyalty_discount).
        net_amount: u64,
        /// Current state of the order.
        status: u8,
        /// Shipping address (encrypted or hashed off-chain, reference stored here).
        shipping_ref: String,
        /// Tracking number once shipped.
        tracking_number: String,
        /// Timestamps for lifecycle tracking.
        created_at: u64,
        paid_at: u64,
        shipped_at: u64,
        delivered_at: u64,
        completed_at: u64,
    }

    /// Escrow holding funds for buyer protection.
    struct Escrow has store, drop, copy {
        order_id: u64,
        buyer: address,
        merchant: address,
        /// Amount held in escrow (net of loyalty discount).
        amount: u64,
        /// Platform fee portion held separately.
        platform_fee: u64,
        /// Whether funds have been released to the merchant.
        is_released: bool,
        /// Whether the escrow has been refunded to the buyer.
        is_refunded: bool,
        /// Timestamp when escrow was created (for timeout calculation).
        created_at: u64,
    }

    /// A review left by a buyer after order completion.
    struct Review has store, drop, copy {
        order_id: u64,
        reviewer: address,
        merchant: address,
        product_id: u64,
        /// Rating from 1 to 5.
        rating: u8,
        /// Text review.
        comment: String,
        /// Timestamp of the review.
        created_at: u64,
    }

    /// Loyalty points account for a user (buyer).
    struct LoyaltyAccount has store, drop, copy {
        owner: address,
        /// Current available points balance.
        balance: u64,
        /// Total points ever earned.
        total_earned: u64,
        /// Total points ever redeemed.
        total_redeemed: u64,
    }

    // =========================================================================
    // Events
    // =========================================================================

    #[event]
    struct MerchantRegisteredEvent has drop, store {
        merchant_id: u64,
        owner: address,
        store_name: String,
        country: String,
    }

    #[event]
    struct ProductListedEvent has drop, store {
        product_id: u64,
        merchant: address,
        name: String,
        price: u64,
        category: String,
    }

    #[event]
    struct ProductUpdatedEvent has drop, store {
        product_id: u64,
        price: u64,
        stock: u64,
        is_active: bool,
    }

    #[event]
    struct OrderCreatedEvent has drop, store {
        order_id: u64,
        buyer: address,
        merchant: address,
        product_id: u64,
        quantity: u64,
        total_price: u64,
        loyalty_discount: u64,
        net_amount: u64,
    }

    #[event]
    struct OrderStatusChangedEvent has drop, store {
        order_id: u64,
        old_status: u8,
        new_status: u8,
    }

    #[event]
    struct EscrowReleasedEvent has drop, store {
        order_id: u64,
        merchant: address,
        amount: u64,
    }

    #[event]
    struct EscrowRefundedEvent has drop, store {
        order_id: u64,
        buyer: address,
        amount: u64,
    }

    #[event]
    struct ReviewSubmittedEvent has drop, store {
        order_id: u64,
        reviewer: address,
        merchant: address,
        product_id: u64,
        rating: u8,
    }

    #[event]
    struct LoyaltyPointsEarnedEvent has drop, store {
        user: address,
        points: u64,
        order_id: u64,
    }

    #[event]
    struct LoyaltyPointsRedeemedEvent has drop, store {
        user: address,
        points: u64,
        order_id: u64,
    }

    // =========================================================================
    // Initialization
    // =========================================================================

    /// Initialize the marketplace. Called once by the deployer.
    /// `payment_token_metadata` is the Object<Metadata> for the accepted payment token.
    public entry fun initialize(
        admin: &signer,
        payment_token_metadata: Object<Metadata>,
        platform_fee_bps: u64,
    ) {
        let admin_addr = signer::address_of(admin);

        let marketplace = Marketplace {
            admin: admin_addr,
            next_merchant_id: 1,
            next_product_id: 1,
            next_order_id: 1,
            merchants: table::new<address, MerchantProfile>(),
            products: table::new<u64, Product>(),
            orders: table::new<u64, Order>(),
            escrows: table::new<u64, Escrow>(),
            reviews: table::new<u64, Review>(),
            loyalty_accounts: table::new<address, LoyaltyAccount>(),
            platform_fee_bps,
            platform_fees_collected: 0,
            payment_token_metadata,
        };

        move_to(admin, marketplace);
    }

    // =========================================================================
    // Merchant Registration & Store Management
    // =========================================================================

    /// Register a new merchant and create their store.
    /// Any address can register once. The merchant profile stores all store metadata.
    public entry fun register_merchant(
        account: &signer,
        marketplace_addr: address,
        store_name: String,
        description: String,
        country: String,
        city: String,
        categories: vector<String>,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        // Ensure the merchant is not already registered.
        assert!(
            !table::contains(&mp.merchants, sender),
            error::already_exists(E_MERCHANT_ALREADY_REGISTERED),
        );

        let merchant_id = mp.next_merchant_id;
        mp.next_merchant_id = merchant_id + 1;

        let now = timestamp::now_seconds();

        let profile = MerchantProfile {
            merchant_id,
            owner: sender,
            store_name: copy store_name,
            description,
            country: copy country,
            city,
            categories,
            is_active: true,
            product_count: 0,
            total_orders: 0,
            total_rating_score: 0,
            rating_count: 0,
            registered_at: now,
        };

        table::add(&mut mp.merchants, sender, profile);

        event::emit(MerchantRegisteredEvent {
            merchant_id,
            owner: sender,
            store_name,
            country,
        });
    }

    /// Update merchant store details. Only the merchant owner can call this.
    public entry fun update_merchant(
        account: &signer,
        marketplace_addr: address,
        store_name: String,
        description: String,
        city: String,
        categories: vector<String>,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.merchants, sender),
            error::not_found(E_MERCHANT_NOT_FOUND),
        );

        let profile = table::borrow_mut(&mut mp.merchants, sender);
        profile.store_name = store_name;
        profile.description = description;
        profile.city = city;
        profile.categories = categories;
    }

    /// Deactivate a merchant store. Products remain but become unlisted.
    public entry fun deactivate_merchant(
        account: &signer,
        marketplace_addr: address,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.merchants, sender),
            error::not_found(E_MERCHANT_NOT_FOUND),
        );

        let profile = table::borrow_mut(&mut mp.merchants, sender);
        assert!(
            profile.owner == sender,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        profile.is_active = false;
    }

    // =========================================================================
    // Product Listing Management
    // =========================================================================

    /// List a new product on the marketplace.
    /// Only registered and active merchants can list products.
    public entry fun list_product(
        account: &signer,
        marketplace_addr: address,
        name: String,
        description: String,
        price: u64,
        stock: u64,
        category: String,
        image_uri: String,
        metadata_json: String,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        // Validate merchant exists and is active.
        assert!(
            table::contains(&mp.merchants, sender),
            error::not_found(E_MERCHANT_NOT_FOUND),
        );
        let merchant = table::borrow_mut(&mut mp.merchants, sender);
        assert!(merchant.is_active, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(price > 0, error::invalid_argument(E_INVALID_PRICE));

        let product_id = mp.next_product_id;
        mp.next_product_id = product_id + 1;

        let now = timestamp::now_seconds();

        let product = Product {
            product_id,
            merchant: sender,
            name: copy name,
            description,
            price,
            stock,
            category: copy category,
            image_uri,
            metadata_json,
            is_active: true,
            created_at: now,
            updated_at: now,
        };

        table::add(&mut mp.products, product_id, product);

        // Increment merchant's product count.
        merchant.product_count = merchant.product_count + 1;

        event::emit(ProductListedEvent {
            product_id,
            merchant: sender,
            name,
            price,
            category,
        });
    }

    /// Update an existing product. Only the product's merchant can update it.
    public entry fun update_product(
        account: &signer,
        marketplace_addr: address,
        product_id: u64,
        name: String,
        description: String,
        price: u64,
        stock: u64,
        category: String,
        image_uri: String,
        metadata_json: String,
        is_active: bool,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.products, product_id),
            error::not_found(E_PRODUCT_NOT_FOUND),
        );

        let product = table::borrow_mut(&mut mp.products, product_id);
        assert!(
            product.merchant == sender,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        assert!(price > 0, error::invalid_argument(E_INVALID_PRICE));

        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.category = category;
        product.image_uri = image_uri;
        product.metadata_json = metadata_json;
        product.is_active = is_active;
        product.updated_at = timestamp::now_seconds();

        event::emit(ProductUpdatedEvent {
            product_id,
            price,
            stock,
            is_active,
        });
    }

    // =========================================================================
    // Order Creation & Fulfillment
    // =========================================================================

    /// Create an order and lock funds in escrow.
    /// The buyer sends payment which is held in the marketplace's escrow table.
    /// `loyalty_points_to_redeem` allows partial payment with loyalty points
    /// (each point = 1 uTIENDA discount).
    public entry fun create_order(
        buyer: &signer,
        marketplace_addr: address,
        product_id: u64,
        quantity: u64,
        shipping_ref: String,
        loyalty_points_to_redeem: u64,
    ) acquires Marketplace {
        let buyer_addr = signer::address_of(buyer);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(quantity > 0, error::invalid_argument(E_ZERO_QUANTITY));

        // Validate product.
        assert!(
            table::contains(&mp.products, product_id),
            error::not_found(E_PRODUCT_NOT_FOUND),
        );

        let product = table::borrow_mut(&mut mp.products, product_id);
        assert!(product.is_active, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(
            product.stock >= quantity,
            error::resource_exhausted(E_INSUFFICIENT_STOCK),
        );
        assert!(
            buyer_addr != product.merchant,
            error::invalid_argument(E_SELF_PURCHASE),
        );

        let total_price = product.price * quantity;
        let merchant_addr = product.merchant;

        // Decrease stock immediately to prevent overselling.
        product.stock = product.stock - quantity;

        // Handle loyalty points redemption.
        let loyalty_discount = if (loyalty_points_to_redeem > 0) {
            // Validate buyer has enough loyalty points.
            assert!(
                table::contains(&mp.loyalty_accounts, buyer_addr),
                error::not_found(E_INSUFFICIENT_LOYALTY_POINTS),
            );
            let loyalty = table::borrow_mut(&mut mp.loyalty_accounts, buyer_addr);
            assert!(
                loyalty.balance >= loyalty_points_to_redeem,
                error::resource_exhausted(E_INSUFFICIENT_LOYALTY_POINTS),
            );

            // Cap discount at total price (can't go negative).
            let discount = if (loyalty_points_to_redeem > total_price) {
                total_price
            } else {
                loyalty_points_to_redeem
            };

            loyalty.balance = loyalty.balance - discount;
            loyalty.total_redeemed = loyalty.total_redeemed + discount;

            discount
        } else {
            0
        };

        let net_amount = total_price - loyalty_discount;

        // Transfer funds from buyer to the marketplace escrow.
        if (net_amount > 0) {
            coin::transfer(
                buyer,
                marketplace_addr,
                mp.payment_token_metadata,
                net_amount,
            );
        };

        // Calculate platform fee.
        let platform_fee = (net_amount * mp.platform_fee_bps) / 10000;

        let order_id = mp.next_order_id;
        mp.next_order_id = order_id + 1;

        let now = timestamp::now_seconds();

        // Create order record.
        let order = Order {
            order_id,
            buyer: buyer_addr,
            merchant: merchant_addr,
            product_id,
            quantity,
            total_price,
            loyalty_discount,
            net_amount,
            status: ORDER_PAID,
            shipping_ref,
            tracking_number: string::utf8(b""),
            created_at: now,
            paid_at: now,
            shipped_at: 0,
            delivered_at: 0,
            completed_at: 0,
        };
        table::add(&mut mp.orders, order_id, order);

        // Create escrow record.
        let escrow = Escrow {
            order_id,
            buyer: buyer_addr,
            merchant: merchant_addr,
            amount: net_amount - platform_fee,
            platform_fee,
            is_released: false,
            is_refunded: false,
            created_at: now,
        };
        table::add(&mut mp.escrows, order_id, escrow);

        // Emit loyalty redemption event if applicable.
        if (loyalty_discount > 0) {
            event::emit(LoyaltyPointsRedeemedEvent {
                user: buyer_addr,
                points: loyalty_discount,
                order_id,
            });
        };

        event::emit(OrderCreatedEvent {
            order_id,
            buyer: buyer_addr,
            merchant: merchant_addr,
            product_id,
            quantity,
            total_price,
            loyalty_discount,
            net_amount,
        });
    }

    /// Merchant marks an order as shipped with a tracking number.
    public entry fun ship_order(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
        tracking_number: String,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow_mut(&mut mp.orders, order_id);
        assert!(
            order.merchant == sender,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        assert!(
            order.status == ORDER_PAID,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        let old_status = order.status;
        order.status = ORDER_SHIPPED;
        order.tracking_number = tracking_number;
        order.shipped_at = timestamp::now_seconds();

        event::emit(OrderStatusChangedEvent {
            order_id,
            old_status,
            new_status: ORDER_SHIPPED,
        });
    }

    /// Buyer confirms delivery. Starts the dispute window.
    public entry fun confirm_delivery(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow_mut(&mut mp.orders, order_id);
        assert!(
            order.buyer == sender,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        assert!(
            order.status == ORDER_SHIPPED,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        let old_status = order.status;
        order.status = ORDER_DELIVERED;
        order.delivered_at = timestamp::now_seconds();

        event::emit(OrderStatusChangedEvent {
            order_id,
            old_status,
            new_status: ORDER_DELIVERED,
        });
    }

    /// Complete an order and release escrow to the merchant.
    /// Can be called by the buyer after delivery, or automatically after the
    /// dispute window expires (called by anyone after timeout).
    public entry fun complete_order(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow_mut(&mut mp.orders, order_id);
        let now = timestamp::now_seconds();

        // Must be delivered status.
        assert!(
            order.status == ORDER_DELIVERED,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        // Either buyer completes, or dispute window has expired (anyone can trigger).
        let is_buyer = order.buyer == sender;
        let dispute_expired = now >= (order.delivered_at + DISPUTE_WINDOW_SECS);
        assert!(
            is_buyer || dispute_expired,
            error::permission_denied(E_NOT_AUTHORIZED),
        );

        let old_status = order.status;
        order.status = ORDER_COMPLETED;
        order.completed_at = now;
        let merchant_addr = order.merchant;
        let buyer_addr = order.buyer;
        let net_amount = order.net_amount;
        let oid = order.order_id;

        // Release escrow.
        let escrow = table::borrow_mut(&mut mp.escrows, order_id);
        assert!(!escrow.is_released, error::invalid_state(E_ESCROW_NOT_RELEASED));
        escrow.is_released = true;

        let merchant_payout = escrow.amount;
        let platform_fee = escrow.platform_fee;

        // Transfer escrow funds from marketplace to merchant.
        coin::transfer(
            account,
            merchant_addr,
            mp.payment_token_metadata,
            merchant_payout,
        );

        // Accumulate platform fee (remains in marketplace account).
        mp.platform_fees_collected = mp.platform_fees_collected + platform_fee;

        // Update merchant stats.
        if (table::contains(&mp.merchants, merchant_addr)) {
            let merchant = table::borrow_mut(&mut mp.merchants, merchant_addr);
            merchant.total_orders = merchant.total_orders + 1;
        };

        // Award loyalty points to buyer based on net amount spent.
        let points_earned = (net_amount * LOYALTY_POINTS_PER_UNIT) / LOYALTY_BASE_UNIT;
        if (points_earned > 0) {
            if (!table::contains(&mp.loyalty_accounts, buyer_addr)) {
                table::add(&mut mp.loyalty_accounts, buyer_addr, LoyaltyAccount {
                    owner: buyer_addr,
                    balance: 0,
                    total_earned: 0,
                    total_redeemed: 0,
                });
            };
            let loyalty = table::borrow_mut(&mut mp.loyalty_accounts, buyer_addr);
            loyalty.balance = loyalty.balance + points_earned;
            loyalty.total_earned = loyalty.total_earned + points_earned;

            event::emit(LoyaltyPointsEarnedEvent {
                user: buyer_addr,
                points: points_earned,
                order_id: oid,
            });
        };

        event::emit(OrderStatusChangedEvent {
            order_id: oid,
            old_status,
            new_status: ORDER_COMPLETED,
        });

        event::emit(EscrowReleasedEvent {
            order_id: oid,
            merchant: merchant_addr,
            amount: merchant_payout,
        });
    }

    // =========================================================================
    // Dispute & Refund
    // =========================================================================

    /// Buyer opens a dispute on a delivered order within the dispute window.
    public entry fun open_dispute(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow_mut(&mut mp.orders, order_id);
        assert!(
            order.buyer == sender,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        assert!(
            order.status == ORDER_DELIVERED,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        let now = timestamp::now_seconds();
        assert!(
            now < (order.delivered_at + DISPUTE_WINDOW_SECS),
            error::invalid_state(E_DISPUTE_WINDOW_EXPIRED),
        );

        let old_status = order.status;
        order.status = ORDER_DISPUTED;

        event::emit(OrderStatusChangedEvent {
            order_id,
            old_status,
            new_status: ORDER_DISPUTED,
        });
    }

    /// Admin resolves a dispute by refunding the buyer.
    /// Funds are returned from escrow and stock is restored.
    public entry fun resolve_dispute_refund(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        // Only admin can resolve disputes.
        assert!(
            sender == mp.admin,
            error::permission_denied(E_NOT_AUTHORIZED),
        );

        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow_mut(&mut mp.orders, order_id);
        assert!(
            order.status == ORDER_DISPUTED,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        let old_status = order.status;
        order.status = ORDER_REFUNDED;
        let buyer_addr = order.buyer;
        let product_id = order.product_id;
        let quantity = order.quantity;

        // Refund escrow.
        let escrow = table::borrow_mut(&mut mp.escrows, order_id);
        assert!(!escrow.is_refunded, error::invalid_state(E_ESCROW_NOT_RELEASED));
        escrow.is_refunded = true;
        let refund_amount = escrow.amount + escrow.platform_fee;

        // Transfer refund from marketplace back to buyer.
        coin::transfer(
            account,
            buyer_addr,
            mp.payment_token_metadata,
            refund_amount,
        );

        // Restore stock.
        if (table::contains(&mp.products, product_id)) {
            let product = table::borrow_mut(&mut mp.products, product_id);
            product.stock = product.stock + quantity;
        };

        event::emit(OrderStatusChangedEvent {
            order_id,
            old_status,
            new_status: ORDER_REFUNDED,
        });

        event::emit(EscrowRefundedEvent {
            order_id,
            buyer: buyer_addr,
            amount: refund_amount,
        });
    }

    /// Admin resolves a dispute in favor of the merchant (releases escrow).
    public entry fun resolve_dispute_release(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            sender == mp.admin,
            error::permission_denied(E_NOT_AUTHORIZED),
        );

        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow_mut(&mut mp.orders, order_id);
        assert!(
            order.status == ORDER_DISPUTED,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        order.status = ORDER_COMPLETED;
        order.completed_at = timestamp::now_seconds();
        let merchant_addr = order.merchant;

        // Release escrow.
        let escrow = table::borrow_mut(&mut mp.escrows, order_id);
        escrow.is_released = true;
        let merchant_payout = escrow.amount;
        let platform_fee = escrow.platform_fee;
        mp.platform_fees_collected = mp.platform_fees_collected + platform_fee;

        // Transfer escrow funds from marketplace to merchant.
        coin::transfer(
            account,
            merchant_addr,
            mp.payment_token_metadata,
            merchant_payout,
        );

        event::emit(EscrowReleasedEvent {
            order_id,
            merchant: merchant_addr,
            amount: merchant_payout,
        });
    }

    /// Cancel an order before it has been shipped. Refunds the buyer.
    public entry fun cancel_order(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow_mut(&mut mp.orders, order_id);

        // Buyer or merchant can cancel before shipping.
        assert!(
            order.buyer == sender || order.merchant == sender,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        assert!(
            order.status == ORDER_PAID,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        let old_status = order.status;
        order.status = ORDER_CANCELLED;
        let buyer_addr = order.buyer;
        let product_id = order.product_id;
        let quantity = order.quantity;

        // Refund escrow.
        let escrow = table::borrow_mut(&mut mp.escrows, order_id);
        escrow.is_refunded = true;
        let refund_amount = escrow.amount + escrow.platform_fee;

        // Transfer refund from marketplace back to buyer.
        coin::transfer(
            account,
            buyer_addr,
            mp.payment_token_metadata,
            refund_amount,
        );

        // Restore stock.
        if (table::contains(&mp.products, product_id)) {
            let product = table::borrow_mut(&mut mp.products, product_id);
            product.stock = product.stock + quantity;
        };

        event::emit(OrderStatusChangedEvent {
            order_id,
            old_status,
            new_status: ORDER_CANCELLED,
        });

        event::emit(EscrowRefundedEvent {
            order_id,
            buyer: buyer_addr,
            amount: refund_amount,
        });
    }

    /// Auto-release escrow after timeout. Anyone can call this to trigger
    /// automatic completion if the escrow has been held beyond the timeout
    /// period and the order is still in PAID or SHIPPED state.
    public entry fun timeout_release_escrow(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
    ) acquires Marketplace {
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        assert!(
            table::contains(&mp.escrows, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let escrow = table::borrow_mut(&mut mp.escrows, order_id);
        let now = timestamp::now_seconds();

        assert!(
            now >= escrow.created_at + ESCROW_TIMEOUT_SECS,
            error::invalid_state(E_ESCROW_TIMEOUT_NOT_REACHED),
        );
        assert!(
            !escrow.is_released && !escrow.is_refunded,
            error::invalid_state(E_ESCROW_NOT_RELEASED),
        );

        escrow.is_released = true;
        let merchant_addr = escrow.merchant;
        let payout = escrow.amount;
        let platform_fee = escrow.platform_fee;
        mp.platform_fees_collected = mp.platform_fees_collected + platform_fee;

        // Transfer escrow funds from marketplace to merchant.
        coin::transfer(
            account,
            merchant_addr,
            mp.payment_token_metadata,
            payout,
        );

        // Mark order as completed.
        let order = table::borrow_mut(&mut mp.orders, order_id);
        order.status = ORDER_COMPLETED;
        order.completed_at = now;

        event::emit(EscrowReleasedEvent {
            order_id,
            merchant: merchant_addr,
            amount: payout,
        });
    }

    // =========================================================================
    // Rating & Review System
    // =========================================================================

    /// Submit a review for a completed order. Each order can only be reviewed once.
    /// Rating must be between 1 and 5 (inclusive).
    public entry fun submit_review(
        account: &signer,
        marketplace_addr: address,
        order_id: u64,
        rating: u8,
        comment: String,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        // Validate rating range.
        assert!(
            rating >= 1 && rating <= MAX_RATING,
            error::invalid_argument(E_INVALID_RATING),
        );

        // Validate order exists and belongs to the reviewer.
        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );

        let order = table::borrow(&mp.orders, order_id);
        assert!(
            order.buyer == sender,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        assert!(
            order.status == ORDER_COMPLETED,
            error::invalid_state(E_INVALID_ORDER_STATE),
        );

        // Ensure no duplicate reviews.
        assert!(
            !table::contains(&mp.reviews, order_id),
            error::already_exists(E_ALREADY_REVIEWED),
        );

        let merchant_addr = order.merchant;
        let product_id = order.product_id;
        let now = timestamp::now_seconds();

        let review = Review {
            order_id,
            reviewer: sender,
            merchant: merchant_addr,
            product_id,
            rating,
            comment,
            created_at: now,
        };

        table::add(&mut mp.reviews, order_id, review);

        // Update merchant rating aggregates.
        if (table::contains(&mp.merchants, merchant_addr)) {
            let merchant = table::borrow_mut(&mut mp.merchants, merchant_addr);
            merchant.total_rating_score = merchant.total_rating_score + (rating as u64);
            merchant.rating_count = merchant.rating_count + 1;
        };

        event::emit(ReviewSubmittedEvent {
            order_id,
            reviewer: sender,
            merchant: merchant_addr,
            product_id,
            rating,
        });
    }

    // =========================================================================
    // Loyalty Points System
    // =========================================================================

    /// Admin can mint bonus loyalty points to a user (promotions, campaigns).
    public entry fun mint_loyalty_points(
        account: &signer,
        marketplace_addr: address,
        recipient: address,
        amount: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        // Only admin or the marketplace itself can mint bonus points.
        assert!(
            sender == mp.admin,
            error::permission_denied(E_NOT_AUTHORIZED),
        );

        if (!table::contains(&mp.loyalty_accounts, recipient)) {
            table::add(&mut mp.loyalty_accounts, recipient, LoyaltyAccount {
                owner: recipient,
                balance: 0,
                total_earned: 0,
                total_redeemed: 0,
            });
        };

        let loyalty = table::borrow_mut(&mut mp.loyalty_accounts, recipient);
        loyalty.balance = loyalty.balance + amount;
        loyalty.total_earned = loyalty.total_earned + amount;
    }

    /// Merchant can grant loyalty points to a specific buyer (promotional).
    public entry fun merchant_grant_points(
        account: &signer,
        marketplace_addr: address,
        recipient: address,
        amount: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);

        // Verify sender is a registered active merchant.
        assert!(
            table::contains(&mp.merchants, sender),
            error::not_found(E_MERCHANT_NOT_FOUND),
        );
        let merchant = table::borrow(&mp.merchants, sender);
        assert!(merchant.is_active, error::permission_denied(E_NOT_AUTHORIZED));

        if (!table::contains(&mp.loyalty_accounts, recipient)) {
            table::add(&mut mp.loyalty_accounts, recipient, LoyaltyAccount {
                owner: recipient,
                balance: 0,
                total_earned: 0,
                total_redeemed: 0,
            });
        };

        let loyalty = table::borrow_mut(&mut mp.loyalty_accounts, recipient);
        loyalty.balance = loyalty.balance + amount;
        loyalty.total_earned = loyalty.total_earned + amount;
    }

    // =========================================================================
    // View functions (read-only queries)
    // =========================================================================

    #[view]
    /// Get merchant profile by address.
    public fun get_merchant(
        marketplace_addr: address,
        merchant_addr: address,
    ): (u64, String, String, String, String, bool, u64, u64, u64, u64) acquires Marketplace {
        let mp = borrow_global<Marketplace>(marketplace_addr);
        assert!(
            table::contains(&mp.merchants, merchant_addr),
            error::not_found(E_MERCHANT_NOT_FOUND),
        );
        let m = table::borrow(&mp.merchants, merchant_addr);
        (
            m.merchant_id,
            m.store_name,
            m.description,
            m.country,
            m.city,
            m.is_active,
            m.product_count,
            m.total_orders,
            m.total_rating_score,
            m.rating_count,
        )
    }

    #[view]
    /// Get product details by ID.
    public fun get_product(
        marketplace_addr: address,
        product_id: u64,
    ): (u64, address, String, String, u64, u64, String, String, bool) acquires Marketplace {
        let mp = borrow_global<Marketplace>(marketplace_addr);
        assert!(
            table::contains(&mp.products, product_id),
            error::not_found(E_PRODUCT_NOT_FOUND),
        );
        let p = table::borrow(&mp.products, product_id);
        (
            p.product_id,
            p.merchant,
            p.name,
            p.description,
            p.price,
            p.stock,
            p.category,
            p.image_uri,
            p.is_active,
        )
    }

    #[view]
    /// Get order details by ID.
    public fun get_order(
        marketplace_addr: address,
        order_id: u64,
    ): (u64, address, address, u64, u64, u64, u64, u64, u8, String) acquires Marketplace {
        let mp = borrow_global<Marketplace>(marketplace_addr);
        assert!(
            table::contains(&mp.orders, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );
        let o = table::borrow(&mp.orders, order_id);
        (
            o.order_id,
            o.buyer,
            o.merchant,
            o.product_id,
            o.quantity,
            o.total_price,
            o.loyalty_discount,
            o.net_amount,
            o.status,
            o.tracking_number,
        )
    }

    #[view]
    /// Get loyalty account balance for a user.
    public fun get_loyalty_balance(
        marketplace_addr: address,
        user: address,
    ): (u64, u64, u64) acquires Marketplace {
        let mp = borrow_global<Marketplace>(marketplace_addr);
        if (!table::contains(&mp.loyalty_accounts, user)) {
            return (0, 0, 0)
        };
        let l = table::borrow(&mp.loyalty_accounts, user);
        (l.balance, l.total_earned, l.total_redeemed)
    }

    #[view]
    /// Get review for an order.
    public fun get_review(
        marketplace_addr: address,
        order_id: u64,
    ): (address, u8, String, u64) acquires Marketplace {
        let mp = borrow_global<Marketplace>(marketplace_addr);
        assert!(
            table::contains(&mp.reviews, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );
        let r = table::borrow(&mp.reviews, order_id);
        (r.reviewer, r.rating, r.comment, r.created_at)
    }

    #[view]
    /// Get escrow status for an order.
    public fun get_escrow(
        marketplace_addr: address,
        order_id: u64,
    ): (u64, u64, bool, bool, u64) acquires Marketplace {
        let mp = borrow_global<Marketplace>(marketplace_addr);
        assert!(
            table::contains(&mp.escrows, order_id),
            error::not_found(E_ORDER_NOT_FOUND),
        );
        let e = table::borrow(&mp.escrows, order_id);
        (e.amount, e.platform_fee, e.is_released, e.is_refunded, e.created_at)
    }

    // =========================================================================
    // Admin functions
    // =========================================================================

    /// Withdraw accumulated platform fees. Only admin.
    public entry fun withdraw_platform_fees(
        account: &signer,
        marketplace_addr: address,
        recipient: address,
        amount: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);
        assert!(
            sender == mp.admin,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        assert!(
            amount <= mp.platform_fees_collected,
            error::resource_exhausted(E_INSUFFICIENT_FUNDS),
        );

        mp.platform_fees_collected = mp.platform_fees_collected - amount;

        coin::transfer(
            account,
            recipient,
            mp.payment_token_metadata,
            amount,
        );
    }

    /// Update the platform fee (in basis points). Only admin.
    public entry fun update_platform_fee(
        account: &signer,
        marketplace_addr: address,
        new_fee_bps: u64,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);
        assert!(
            sender == mp.admin,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        mp.platform_fee_bps = new_fee_bps;
    }

    /// Transfer admin role to a new address. Only current admin.
    public entry fun transfer_admin(
        account: &signer,
        marketplace_addr: address,
        new_admin: address,
    ) acquires Marketplace {
        let sender = signer::address_of(account);
        let mp = borrow_global_mut<Marketplace>(marketplace_addr);
        assert!(
            sender == mp.admin,
            error::permission_denied(E_NOT_AUTHORIZED),
        );
        mp.admin = new_admin;
    }
}
