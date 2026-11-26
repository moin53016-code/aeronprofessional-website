-- CreateIndex
CREATE INDEX "admin_sessions_userId_idx" ON "admin_sessions"("userId");

-- CreateIndex
CREATE INDEX "admin_sessions_expiresAt_idx" ON "admin_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_createdAt_idx" ON "audit_logs"("adminId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "categories_isPublished_isVisible_displayOrder_idx" ON "categories"("isPublished", "isVisible", "displayOrder");

-- CreateIndex
CREATE INDEX "discount_campaigns_createdAt_idx" ON "discount_campaigns"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "discount_products_productId_idx" ON "discount_products"("productId");

-- CreateIndex
CREATE INDEX "faqs_isActive_displayOrder_idx" ON "faqs"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "homepage_banners_isActive_displayOrder_idx" ON "homepage_banners"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "marketplaces_isActive_createdAt_idx" ON "marketplaces"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "product_categories"("categoryId");

-- CreateIndex
CREATE INDEX "product_images_productId_displayOrder_idx" ON "product_images"("productId", "displayOrder");

-- CreateIndex
CREATE INDEX "product_marketplace_links_marketplaceId_idx" ON "product_marketplace_links"("marketplaceId");

-- CreateIndex
CREATE INDEX "product_specifications_productId_displayOrder_idx" ON "product_specifications"("productId", "displayOrder");

-- CreateIndex
CREATE INDEX "products_status_displayOrder_idx" ON "products"("status", "displayOrder");

-- CreateIndex
CREATE INDEX "products_displayOrder_createdAt_idx" ON "products"("displayOrder", "createdAt" DESC);
