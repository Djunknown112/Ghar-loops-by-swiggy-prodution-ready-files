import React, { useState, useEffect } from "react";
import { SwiggyProduct, mockProducts } from "../data/mockProducts";
import { ScheduleItem, Frequency, AutomationLevel } from "../types";
import { Search, Plus, Check, HelpCircle, ArrowRight, Sparkles, ChevronLeft, Calendar, Bell, Shield, ArrowLeft } from "lucide-react";

interface AddProductTabProps {
  onAddScheduleItem: (item: Omit<ScheduleItem, "id">) => Promise<void>;
  existingSchedules: ScheduleItem[];
}

interface CategoryTile {
  id: string;
  label: string;
  emoji: string;
  bgClass: string;
  borderClass: string;
}

const CATEGORIES: CategoryTile[] = [
  { id: "dairy", label: "Dairy & Eggs", emoji: "🥛🥚", bgClass: "bg-[#FFF0E6]", borderClass: "border-orange-100" },
  { id: "staples", label: "Staples & Dal", emoji: "🌾🍚", bgClass: "bg-amber-50", borderClass: "border-amber-100" },
  { id: "meals", label: "Meals & Bowls", emoji: "🍛🍕", bgClass: "bg-rose-50", borderClass: "border-rose-100" },
  { id: "medicines", label: "Medicines", emoji: "💊🩹", bgClass: "bg-indigo-50", borderClass: "border-indigo-100" },
  { id: "subscriptions", label: "Subscriptions", emoji: "📅📰", bgClass: "bg-emerald-50", borderClass: "border-emerald-100" }
];

export default function AddProductTab({ onAddScheduleItem, existingSchedules }: AddProductTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SwiggyProduct | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Bottom Sheet configuration states
  const [quantity, setQuantity] = useState<number>(1);
  const [frequency, setFrequency] = useState<Frequency>("Weekly");
  const [automationLevel, setAutomationLevel] = useState<AutomationLevel>("Ask me first");
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(3);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter products based on selected category or search query
  const getFilteredProducts = (): SwiggyProduct[] => {
    let list = mockProducts;

    // Apply category filter
    if (selectedCategory) {
      if (selectedCategory === "dairy") {
        list = list.filter(p => p.category === "Groceries" && (
          p.name.toLowerCase().includes("milk") ||
          p.name.toLowerCase().includes("egg") ||
          p.name.toLowerCase().includes("bread") ||
          p.name.toLowerCase().includes("butter") ||
          p.name.toLowerCase().includes("coffee")
        ));
      } else if (selectedCategory === "staples") {
        list = list.filter(p => p.category === "Groceries" && !(
          p.name.toLowerCase().includes("milk") ||
          p.name.toLowerCase().includes("egg") ||
          p.name.toLowerCase().includes("bread") ||
          p.name.toLowerCase().includes("butter") ||
          p.name.toLowerCase().includes("coffee")
        ));
      } else if (selectedCategory === "meals") {
        list = list.filter(p => p.category === "Meals");
      } else if (selectedCategory === "medicines") {
        list = list.filter(p => p.category === "Medicines");
      } else if (selectedCategory === "subscriptions") {
        list = list.filter(p => p.category === "Subscriptions");
      }
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const handleProductTap = (product: SwiggyProduct) => {
    if (isAlreadyScheduled(product.productId)) return;
    setSelectedProduct(product);
    setQuantity(1);
    setFrequency("Weekly");
    setAutomationLevel("Ask me first");
    setIsBottomSheetOpen(true);
  };

  const handleConfirmSchedule = async () => {
    if (!selectedProduct) return;

    const schedulePayload: Omit<ScheduleItem, "id"> = {
      productId: selectedProduct.productId,
      productName: selectedProduct.name,
      brand: selectedProduct.brand,
      price: selectedProduct.price,
      unit: selectedProduct.unit,
      category: selectedProduct.category,
      quantity: quantity,
      frequency: frequency,
      nextDue: new Date().toISOString().split("T")[0], // Default due today so loop picks it up
      automationLevel: automationLevel,
      customIntervalDays: frequency === "Custom" ? customIntervalDays : undefined
    };

    try {
      await onAddScheduleItem(schedulePayload);
      setSuccessMessage(`Successfully added '${selectedProduct.name}' to your schedule!`);
      setIsBottomSheetOpen(false);
      setSelectedProduct(null);
      
      // Clear success message
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const isAlreadyScheduled = (productId: string) => {
    return existingSchedules.some((s) => s.productId === productId);
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div id="add-product-tab" className="space-y-6 pb-24 relative select-none">
      {/* Tab Heading */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#FC8019]">Fast Essentials Catalog</span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Add Essentials</h1>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Shop by category or search. Schedule items to auto-refill dynamically.
        </p>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-slide-down">
          <Check className="w-4 h-4 shrink-0 text-emerald-500" />
          {successMessage}
        </div>
      )}

      {/* Top Search Bar with soft rounded corners */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-4.5 h-4.5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Open results immediately if user searches
            if (e.target.value && !selectedCategory) {
              // Stay on categories view but show search results
            }
          }}
          placeholder="Search for milk, dal, rice, or paracetamol..."
          className="w-full bg-white text-slate-800 text-sm pl-11 pr-10 py-3.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#FC8019]/25 focus:border-[#FC8019] shadow-2xs font-semibold placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* RENDER CATEGORY SELECTOR OR DETAILED GRID */}
      {!selectedCategory && !searchQuery.trim() ? (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Shop by Category</h3>
          
          {/* Shop by Category Grid - Blinkit-style 4 tiles per row */}
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center text-center space-y-1.5 focus:outline-none active:scale-95 transition-all"
              >
                {/* Large soft-rounded tile target */}
                <div className={`w-16 h-16 ${cat.bgClass} border ${cat.borderClass} rounded-2xl flex items-center justify-center shadow-2xs`}>
                  <span className="text-2xl">{cat.emoji}</span>
                </div>
                {/* Short 1-2 word label */}
                <span className="text-[10px] font-black text-slate-700 leading-tight tracking-tight px-0.5">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          {/* Quick FAQ info block */}
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex gap-3 items-start mt-2">
            <Sparkles className="w-5 h-5 text-[#FC8019] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-black text-slate-800">Swiggy Loop Integrations</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                Set automation levels for each household necessity. We handle repeat deliveries silently behind the scenes.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // PRODUCT GRID VIEW (For Selected Category or Search Results)
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery("");
              }}
              className="flex items-center gap-1.5 text-xs font-black text-[#FC8019] hover:text-orange-600 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Categories
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {searchQuery ? "Search Results" : CATEGORIES.find(c => c.id === selectedCategory)?.label} ({filteredProducts.length})
            </span>
          </div>

          {/* Product Grid - 2 Column Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            {filteredProducts.map((product) => {
              const scheduled = isAlreadyScheduled(product.productId);
              return (
                <div
                  key={product.productId}
                  onClick={() => handleProductTap(product)}
                  className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:border-orange-300 shadow-3xs hover:shadow-2xs ${
                    scheduled ? "opacity-75 border-slate-100 bg-slate-50/40" : "border-slate-100"
                  }`}
                >
                  {/* Category Indicator & Placeholder Circle */}
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#FC8019] bg-[#FFF0E6] px-1.5 py-0.5 rounded-md">
                      {product.brand}
                    </span>
                    <span className="text-lg">
                      {product.category === "Groceries" ? "🥛" : product.category === "Meals" ? "🍛" : product.category === "Medicines" ? "💊" : "📅"}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {product.unit}
                    </p>
                  </div>

                  {/* Price & Action button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-black text-slate-800">₹{product.price}</span>
                    
                    {scheduled ? (
                      <span className="bg-emerald-50 text-emerald-600 rounded-full p-1 border border-emerald-100 text-[10px]">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <button className="bg-[#FFF0E6] text-[#FC8019] hover:bg-[#FC8019] hover:text-white rounded-full p-1 transition-all active:scale-90">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-2 bg-slate-50/50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No essentials match your criteria.</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Try searching for simple ingredients like 'milk', 'dal', or 'atta'.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM SHEET MODAL (Quantity selector + interval + automation levels) */}
      {isBottomSheetOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setIsBottomSheetOpen(false)}></div>
          
          {/* Bottom Sheet Drawer */}
          <div className="bg-white rounded-t-[32px] w-full max-w-md p-6 pb-8 space-y-5 relative z-10 animate-slide-up shadow-2xl border-t border-slate-100">
            {/* Sheet Notch */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-1"></div>

            {/* Header Product Details */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-black text-[#FC8019] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md">
                  {selectedProduct.brand}
                </span>
                <h3 className="text-base font-black text-slate-800 leading-tight mt-1">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">₹{selectedProduct.price} per {selectedProduct.unit}</p>
              </div>
              <button
                onClick={() => setIsBottomSheetOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl"
              >
                Cancel
              </button>
            </div>

            {/* Content Selection Controls */}
            <div className="space-y-4.5">
              
              {/* 1. Quantity Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-800">Select Quantity</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Number of standard household packs</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(q => q - 1)}
                    className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-slate-800 w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. Frequency Select */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800">Reorder Interval (Frequency)</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["Daily", "Weekly", "Monthly", "Custom"] as Frequency[]).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        frequency === freq
                          ? "bg-[#FFF0E6] border-[#FC8019] text-[#FC8019] shadow-3xs"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {freq === "Custom" ? `${customIntervalDays} Days` : freq}
                    </button>
                  ))}
                </div>
                {frequency === "Custom" && (
                  <div className="mt-2 p-3 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Custom Days Interval</span>
                      <span className="text-[#FC8019] bg-white px-2 py-0.5 rounded-lg border border-orange-100 shadow-3xs">Every {customIntervalDays} days</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={customIntervalDays}
                      onChange={(e) => setCustomIntervalDays(Number(e.target.value))}
                      className="w-full accent-[#FC8019] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>2 days</span>
                      <span>15 days</span>
                      <span>30 days</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Automation Level Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800">Automation Rule</label>
                <div className="space-y-2">
                  {[
                    { level: "Remind me" as AutomationLevel, icon: <Bell className="w-4 h-4 text-rose-500 shrink-0" />, desc: "Notify me on due date. Let me order manually." },
                    { level: "Ask me first" as AutomationLevel, icon: <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />, desc: "Queue approval cards. Click to order on due date." },
                    { level: "Auto-order" as AutomationLevel, icon: <Shield className="w-4 h-4 text-emerald-500 shrink-0" />, desc: "Place reorder on Swiggy Instamart automatically on due date." }
                  ].map((rule) => (
                    <label
                      key={rule.level}
                      onClick={() => setAutomationLevel(rule.level)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        automationLevel === rule.level
                          ? "bg-orange-50/30 border-[#FC8019]"
                          : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="automationTierRadio"
                        checked={automationLevel === rule.level}
                        onChange={() => setAutomationLevel(rule.level)}
                        className="mt-1 text-[#FC8019] focus:ring-[#FC8019]"
                      />
                      <div className="flex gap-2 items-start">
                        <div className="bg-slate-50 p-1.5 rounded-lg shrink-0 mt-0.5">{rule.icon}</div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{rule.level}</p>
                          <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">{rule.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center text-xs font-bold border border-slate-100">
                <span className="text-slate-500">Estimated Reorder Total:</span>
                <span className="text-sm font-black text-slate-800">₹{selectedProduct.price * quantity}</span>
              </div>

              {/* Add Button */}
              <button
                onClick={handleConfirmSchedule}
                className="w-full bg-[#FC8019] hover:bg-[#e06e12] text-white py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Add to Loop Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
