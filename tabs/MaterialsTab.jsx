// The materials tab, loaded when first opened. State and handlers stay in the
// app and arrive as props; this module only renders.
import { canManage, isOwner } from "../company-store.js";
import { COLORS } from "../ui/theme.js";
import {
  BookOpen,
  ExternalLink,
  GripVertical,
  ImagePlus,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { ORDER_STATES } from "../roofing-site-manager.jsx";
import { useState } from "react";
import { articlesFor, filterArticles, sortArticles } from "../price-list.js";

// The supplier's whole list as a sheet: search, sortable columns, a virtual
// window of rows so thousands scroll on a phone, «+» into the basket, and
// every row draggable onto a job or a dock tile.
function ArticleSheet({ rows, t, onAdd, dragProps, onImport }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [dir, setDir] = useState("asc");
  const [top, setTop] = useState(0);
  const ROW = 44,
    VIEW = 420;
  const shown = sortArticles(filterArticles(rows, q), sortKey, dir);
  const first = Math.max(0, Math.floor(top / ROW) - 10);
  const last = Math.min(shown.length, first + Math.ceil(VIEW / ROW) + 20);
  const demo = rows.length > 0 && !!rows[0].demo;
  const head = (key, label, align) => (
    <button
      data-sort-col={key}
      onClick={() => {
        if (sortKey === key) setDir(dir === "asc" ? "desc" : "asc");
        else {
          setSortKey(key);
          setDir("asc");
        }
      }}
      style={{ color: sortKey === key ? COLORS.accent : COLORS.muted }}
      className={`text-xs uppercase tracking-wide font-bold truncate ${align === "right" ? "text-right" : "text-left"}`}
    >
      {label}
      {sortKey === key ? (dir === "asc" ? " ▲" : " ▼") : ""}
    </button>
  );
  const cols = "5.5rem minmax(0,1fr) 3.5rem 4.5rem 2rem";
  return (
    <div
      data-article-sheet
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      className="rounded-xl p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Search size={14} color={COLORS.muted} className="shrink-0" />
        <input
          aria-label={t.sheetSearch}
          data-sheet-search
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setTop(0);
          }}
          placeholder={t.sheetSearch}
          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <span data-sheet-count style={{ color: COLORS.muted }} className="text-xs shrink-0 tabular-nums">
          {q ? `${shown.length} / ${rows.length}` : `${rows.length} ${t.sheetArticles}`}
        </span>
      </div>
      {demo && (
        <div style={{ color: COLORS.amber }} className="text-xs mb-2 flex flex-wrap items-center gap-x-2">
          <span>{t.sheetDemo}</span>
          {onImport && (
            <button onClick={onImport} style={{ color: COLORS.accent }} className="underline font-bold">
              {t.importPriceList}
            </button>
          )}
        </div>
      )}
      <div
        className="grid gap-2 px-1 pb-1"
        style={{ gridTemplateColumns: cols, borderBottom: `1px solid ${COLORS.border}` }}
      >
        {head("artNo", t.artNoShort)}
        {head("name", t.itemNameLabel)}
        {head("unit", t.sortUnit)}
        {head("price", t.unitPriceLabel, "right")}
        <span />
      </div>
      <div
        data-sheet-scroll
        onScroll={(e) => setTop(e.currentTarget.scrollTop)}
        style={{ maxHeight: VIEW, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
      >
        <div style={{ height: first * ROW }} />
        {shown.slice(first, last).map((a) => (
          <div
            key={`${a.artNo}|${a.name}`}
            data-article-row
            {...dragProps(a.name, "material", { unit: a.unit, artNo: a.artNo, supplier: a.supplier })}
            style={{ height: ROW, borderBottom: `1px solid ${COLORS.border}`, gridTemplateColumns: cols }}
            className="grid items-center gap-2 px-1 text-xs cursor-grab"
          >
            <span style={{ color: COLORS.muted }} className="font-mono truncate">
              {a.artNo || "—"}
            </span>
            <span className="truncate font-semibold" title={a.name}>
              {a.name}
            </span>
            <span style={{ color: COLORS.muted }} className="truncate">
              {a.unit || ""}
            </span>
            <span className="tabular-nums text-right truncate">{a.price || ""}</span>
            <button
              aria-label={t.a11yAdd}
              data-sheet-add
              onClick={() => onAdd(a)}
              title={t.basketLabel}
              style={{ background: COLORS.accent }}
              className="tap w-7 h-7 rounded-full flex items-center justify-center"
            >
              <Plus size={14} color="#fff" />
            </button>
          </div>
        ))}
        <div style={{ height: Math.max(0, (shown.length - last) * ROW) }} />
      </div>
      {shown.length === 0 && (
        <div style={{ color: COLORS.muted }} className="text-sm py-3 text-center">
          {t.nothingLogged}
        </div>
      )}
    </div>
  );
}

export function MaterialsTab({
  materialDragProps,
  addToBasket,
  articleMaster,
  basket,
  catalogs,
  deleteEntryFn,
  deleteLibraryItem,
  entries,
  lang,
  librarySearch,
  materialSearch,
  materialsCatalogFor,
  materialsSubTab,
  openLibraryEdit,
  openLibraryScan,
  openPickup,
  openScan,
  priceFileRef,
  projectName,
  projects,
  removeBasketItem,
  setBasket,
  setBasketMode,
  setBasketProjectModalOpen,
  setLibrarySearch,
  setMaterialSearch,
  setMaterialsSubTab,
  setOrderStatus,
  setShopCat,
  setSortMode,
  shopCat,
  sortMode,
  stagePriceList,
  t,
  techLibrary,
  toolsCatalogFor,
  updateBasketItem,
  user,
}) {
  const catalog = materialsCatalogFor(lang);
  const toolsCatalog = toolsCatalogFor(lang);
  const MATERIAL_TYPE_KEYS = ["wood", "membranes", "metal", "insulation", "fasteners", "covering"];
  const MATERIAL_SUPPLIER_KEYS = ["hgc", "gabs", "soprema", "velux", "glaromat", "gyso"];
  const TOOL_SUPPLIER_KEYS = ["hgc", "sfs", "hasler"];
  const TOOL_TYPE_KEYS = ["power", "hand", "safety", "rental"];
  const TOOL_TYPE_LABELS = { power: t.typePower, hand: t.typeHand, safety: t.typeSafety, rental: t.typeRental };

  const SortToggle = () => (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => {
          setSortMode("type");
          setShopCat(null);
        }}
        style={{
          background: sortMode === "type" ? COLORS.accentDim : COLORS.cardAlt,
          border: `1px solid ${COLORS.border}`,
        }}
        className="py-2 rounded-lg text-xs font-bold"
      >
        {t.sortByTypeBtn}
      </button>
      <button
        onClick={() => {
          setSortMode("supplier");
          setShopCat(null);
        }}
        style={{
          background: sortMode === "supplier" ? COLORS.accentDim : COLORS.cardAlt,
          border: `1px solid ${COLORS.border}`,
        }}
        className="py-2 rounded-lg text-xs font-bold"
      >
        {t.sortBySupplierBtn}
      </button>
    </div>
  );

  const known = Object.keys(articleMaster).length;
  return (
    <div className="flex flex-col gap-3">
      {/* The catalog below is a fixed shopping list. This is the firm's
          own article master: what it actually buys, at what price,
          under which article number. */}
      {isOwner() && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold flex items-center gap-1.5">
                <BookOpen size={14} color={COLORS.accent} /> {t.articleMasterTitle}
              </div>
              <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">
                {known > 0 ? `${known} ${t.articlesKnown}` : t.articleMasterEmpty}
              </div>
            </div>
            <button
              onClick={() => priceFileRef.current?.click()}
              style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.accent }}
              className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase"
            >
              {t.importPriceList}
            </button>
          </div>
          <input
            ref={priceFileRef}
            type="file"
            accept=".csv,.txt,.tsv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              stagePriceList(f, "");
            }}
          />
        </div>
      )}
      {(() => {
        // Requests from every job in one place, grouped by merchant,
        // because one order goes to one merchant and covers several
        // roofs. Crew see what they asked for; the office sees the lot.
        const open = entries.filter((e) => e.type === "order" && e.orderStatus !== "delivered");
        const mine = canManage() ? open : open.filter((e) => e.userId === user?.uid);
        if (mine.length === 0) return null;
        const bySupplier = {};
        mine.forEach((e) => {
          (bySupplier[e.supplier || t.supplierUnknown] = bySupplier[e.supplier || t.supplierUnknown] || []).push(e);
        });
        return (
          <div style={{ background: COLORS.card, border: `1px solid #C68B4F55` }} className="rounded-xl p-3">
            <div
              style={{ color: "#C68B4F" }}
              className="text-xs uppercase tracking-wide mb-2 font-bold flex items-center gap-1.5"
            >
              <Truck size={13} /> {t.orderListTitle} ({mine.length})
            </div>
            <div className="flex flex-col gap-3">
              {Object.entries(bySupplier).map(([sup, items]) => (
                <div key={sup}>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1.5">
                    {sup}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {items.map((e) => {
                      const st = ORDER_STATES.find((x) => x.key === (e.orderStatus || "requested")) || ORDER_STATES[0];
                      return (
                        <div key={e.id} style={{ background: COLORS.cardAlt }} className="rounded-lg px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm truncate">{e.description}</div>
                              <div style={{ color: COLORS.muted }} className="text-xs truncate">
                                {[projectName(e.projectId), e.artNo && `${t.artNoShort} ${e.artNo}`]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </div>
                            <span style={{ color: COLORS.muted }} className="shrink-0 text-xs tabular-nums">
                              {e.qty}
                              {e.unit ? " " + e.unit : ""}
                            </span>
                            <span
                              style={{
                                background: `${st.color}22`,
                                color: st.color,
                                border: `1px solid ${st.color}66`,
                              }}
                              className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full uppercase"
                            >
                              {t[st.labelKey]}
                            </span>
                          </div>
                          {canManage() && (
                            <div className="flex gap-1.5 mt-1.5">
                              {e.orderStatus !== "ordered" && (
                                <button
                                  onClick={() => setOrderStatus(e, "ordered")}
                                  style={{
                                    background: COLORS.shell,
                                    border: `1px solid ${COLORS.border}`,
                                    color: "#6FB3D9",
                                  }}
                                  className="flex-1 py-1.5 rounded text-xs font-bold uppercase"
                                >
                                  {t.markOrdered}
                                </button>
                              )}
                              <button
                                onClick={() => setOrderStatus(e, "delivered")}
                                style={{
                                  background: COLORS.shell,
                                  border: `1px solid ${COLORS.border}`,
                                  color: COLORS.success,
                                }}
                                className="flex-1 py-1.5 rounded text-xs font-bold uppercase"
                              >
                                {t.markDelivered}
                              </button>
                              <button
                                aria-label={t.a11yDelete}
                                title={t.a11yDelete}
                                onClick={() => deleteEntryFn(e)}
                                style={{ color: COLORS.danger }}
                                className="tap px-2"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {/* One box finds a thing wherever it lives: our own article
          master first (it has the price and the article number), then
          the merchants' catalogs. Every hit can be dragged to a job. */}
      <div
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        className="rounded-xl px-3 py-2 flex items-center gap-2"
      >
        <Search size={15} color={COLORS.muted} className="shrink-0" />
        <input
          aria-label={t.materialSearchPlaceholder}
          value={materialSearch}
          onChange={(e) => setMaterialSearch(e.target.value)}
          placeholder={t.materialSearchPlaceholder}
          style={{ background: "transparent", color: COLORS.text }}
          className="flex-1 min-w-0 text-sm outline-none"
        />
        {materialSearch && (
          <button
            aria-label={t.a11yClose}
            title={t.a11yClose}
            onClick={() => setMaterialSearch("")}
            style={{ color: COLORS.muted }}
            className="tap shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            setMaterialsSubTab("shop");
            setShopCat(null);
          }}
          style={{
            background: materialsSubTab === "shop" ? COLORS.accent : COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
          className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
        >
          <ShoppingCart size={14} /> {t.shopTab}
        </button>
        <button
          onClick={() => {
            setMaterialsSubTab("tools");
            setShopCat(null);
          }}
          style={{
            background: materialsSubTab === "tools" ? COLORS.accent : COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
          className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
        >
          <Wrench size={14} /> {t.toolsTab}
        </button>
        <button
          onClick={() => {
            setMaterialsSubTab("transport");
            setShopCat(null);
          }}
          style={{
            background: materialsSubTab === "transport" ? COLORS.accent : COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
          className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
        >
          <Truck size={14} /> {t.transportTab}
        </button>
        <button
          onClick={() => {
            setMaterialsSubTab("library");
            setShopCat(null);
          }}
          style={{
            background: materialsSubTab === "library" ? COLORS.accent : COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
          className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
        >
          <BookOpen size={14} /> {t.libraryTab}
        </button>
      </div>

      {materialSearch.trim() &&
        (materialsSubTab === "shop" || materialsSubTab === "tools") &&
        (() => {
          const q = materialSearch.trim().toLowerCase();
          const own = Object.values(articleMaster)
            .filter((a) =>
              String(a.name || "")
                .toLowerCase()
                .includes(q),
            )
            .slice(0, 40);
          const seen = new Set(own.map((a) => String(a.name).toLowerCase()));
          const found = [];
          const consider = (name, kind, where) => {
            const k = String(name).toLowerCase();
            if (!k.includes(q) || seen.has(k)) return;
            seen.add(k);
            found.push({ name, kind, where });
          };
          Object.entries(catalog.items || {}).forEach(([key, groups]) =>
            groups.forEach((g) => g.items.forEach((n) => consider(n, "material", catalog.cats[key]))),
          );
          Object.entries(toolsCatalog.items || {}).forEach(([key, groups]) =>
            groups.forEach((g) => g.items.forEach((n) => consider(n, "tool", toolsCatalog.cats[key]))),
          );
          const hits = found.slice(0, 60);
          const chip = (name, kind, sub) => (
            <button
              key={kind + name}
              {...materialDragProps(name, kind)}
              onClick={() => addToBasket(name, kind)}
              style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
              className="px-2.5 py-1.5 rounded-lg text-xs text-left cursor-grab active:cursor-grabbing"
            >
              <div>{name}</div>
              {sub && (
                <div style={{ color: COLORS.muted }} className="text-xs">
                  {sub}
                </div>
              )}
            </button>
          );
          return (
            <div className="flex flex-col gap-3">
              {own.length > 0 && (
                <div>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
                    {t.searchOurArticles} ({own.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {own.map((a) =>
                      chip(
                        a.name,
                        "material",
                        [
                          a.supplier,
                          a.artNo && `${t.artNoShort} ${a.artNo}`,
                          a.price && `${a.price}${a.unit ? "/" + a.unit : ""}`,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      ),
                    )}
                  </div>
                </div>
              )}
              {hits.length > 0 && (
                <div>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
                    {t.searchCatalog} ({hits.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">{hits.map((h) => chip(h.name, h.kind, h.where))}</div>
                </div>
              )}
              {own.length === 0 && hits.length === 0 && (
                <div style={{ color: COLORS.muted }} className="text-sm">
                  {t.searchNoResults}
                </div>
              )}
            </div>
          );
        })()}

      {materialsSubTab === "shop" && !materialSearch.trim() && (
        <>
          <SortToggle />
          <div className="grid grid-cols-2 gap-2">
            {(sortMode === "type" ? MATERIAL_TYPE_KEYS : MATERIAL_SUPPLIER_KEYS).map((key) => (
              <button
                key={key}
                onClick={() => setShopCat((c) => (c === key ? null : key))}
                style={{
                  background: shopCat === key ? COLORS.success : COLORS.cardAlt,
                  border: `1px solid ${COLORS.border}`,
                }}
                className="px-2.5 py-2.5 rounded-lg text-xs font-bold text-center"
              >
                {catalog.cats[key]}
              </button>
            ))}
          </div>
          {shopCat && sortMode === "supplier" && (
            <div className="flex flex-col gap-2">
              {catalog.links[shopCat] && (
                <a
                  href={catalog.links[shopCat]}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: COLORS.accent }}
                  className="text-xs flex items-center gap-1 underline"
                >
                  <ExternalLink size={13} /> {t.openShopBtn}
                </a>
              )}
              <ArticleSheet
                rows={articlesFor(articleMaster, catalog, shopCat)}
                t={t}
                onAdd={(a) =>
                  addToBasket(a.name, "material", {
                    unit: a.unit,
                    price: a.price,
                    artNo: a.artNo,
                    supplier: a.supplier,
                  })
                }
                dragProps={materialDragProps}
                onImport={priceFileRef ? () => priceFileRef.current?.click() : null}
              />
            </div>
          )}
          {shopCat && sortMode === "type" && (
            <div className="flex flex-col gap-2">
              {catalog.items[shopCat].map((grp) => (
                <div key={grp.group}>
                  <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
                    {grp.group}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {grp.items.map((name) => (
                      <button
                        key={name}
                        {...materialDragProps(name, "material")}
                        onClick={() => addToBasket(name, "material")}
                        style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                        className="px-2.5 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {materialsSubTab === "tools" && !materialSearch.trim() && (
        <>
          <SortToggle />
          {sortMode === "supplier" ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {TOOL_SUPPLIER_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setShopCat((c) => (c === key ? null : key))}
                    style={{
                      background: shopCat === key ? COLORS.success : COLORS.cardAlt,
                      border: `1px solid ${COLORS.border}`,
                    }}
                    className="px-2 py-2.5 rounded-lg text-xs font-bold text-center"
                  >
                    {toolsCatalog.cats[key]}
                  </button>
                ))}
              </div>
              {shopCat && (
                <div className="flex flex-col gap-2">
                  <a
                    href={toolsCatalog.links[shopCat]}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: COLORS.accent }}
                    className="text-xs flex items-center gap-1 underline"
                  >
                    <ExternalLink size={13} /> {t.openShopBtn}
                  </a>
                  {toolsCatalog.items[shopCat].map((grp) => (
                    <div key={grp.group}>
                      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
                        {grp.group}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {grp.items.map((name) => (
                          <button
                            key={name}
                            {...materialDragProps(name, "tool")}
                            onClick={() => addToBasket(name, "tool")}
                            style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                            className="px-2.5 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {TOOL_TYPE_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setShopCat((c) => (c === key ? null : key))}
                    style={{
                      background: shopCat === key ? COLORS.success : COLORS.cardAlt,
                      border: `1px solid ${COLORS.border}`,
                    }}
                    className="px-2.5 py-2.5 rounded-lg text-xs font-bold text-center"
                  >
                    {TOOL_TYPE_LABELS[key]}
                  </button>
                ))}
              </div>
              {shopCat && (
                <div className="flex flex-col gap-2">
                  {TOOL_SUPPLIER_KEYS.map((supplierKey) => {
                    const matchingGroups = toolsCatalog.items[supplierKey].filter((g) => g.type === shopCat);
                    if (matchingGroups.length === 0) return null;
                    return (
                      <div key={supplierKey}>
                        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
                          {toolsCatalog.cats[supplierKey]}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {matchingGroups
                            .flatMap((g) => g.items)
                            .map((name) => (
                              <button
                                key={name}
                                {...materialDragProps(name, "tool")}
                                onClick={() => addToBasket(name, "tool")}
                                style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                                className="px-2.5 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing"
                              >
                                {name}
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {materialsSubTab === "transport" && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => openScan("single")}
            disabled={projects.length === 0}
            style={{
              background: COLORS.card,
              border: `1px dashed ${COLORS.success}`,
              opacity: projects.length === 0 ? 0.4 : 1,
            }}
            className="w-full rounded-xl p-3 flex items-center justify-center gap-2"
          >
            <ScanLine size={18} color={COLORS.success} />
            <span className="text-sm font-semibold">{t.scanDelivery}</span>
          </button>
          <button
            onClick={() => openScan("compare")}
            disabled={projects.length === 0}
            style={{
              background: COLORS.card,
              border: `1px dashed ${COLORS.success}`,
              opacity: projects.length === 0 ? 0.4 : 1,
            }}
            className="w-full rounded-xl p-3 flex items-center justify-center gap-2"
          >
            <ImagePlus size={18} color={COLORS.success} />
            <span className="text-sm font-semibold">{t.beforeAfter}</span>
          </button>
          <button
            onClick={openPickup}
            disabled={projects.length === 0}
            style={{ background: COLORS.card, border: `1px dashed #C9A6F5`, opacity: projects.length === 0 ? 0.4 : 1 }}
            className="w-full rounded-xl p-3 flex items-center justify-center gap-2"
          >
            <QrCode size={18} color="#C9A6F5" />
            <span className="text-sm font-semibold">{t.pickupCode}</span>
          </button>
        </div>
      )}

      {materialsSubTab === "library" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={openLibraryScan}
              style={{ background: COLORS.card, border: `1px dashed ${COLORS.success}` }}
              className="rounded-xl p-3 flex flex-col items-center justify-center gap-1"
            >
              <ScanLine size={18} color={COLORS.success} />
              <span className="text-xs font-semibold text-center">{t.scanSpecSheet}</span>
            </button>
            <button
              onClick={() => openLibraryEdit(null)}
              style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}` }}
              className="rounded-xl p-3 flex flex-col items-center justify-center gap-1"
            >
              <Plus size={18} color={COLORS.muted} />
              <span className="text-xs font-semibold text-center">{t.addManually}</span>
            </button>
          </div>
          {techLibrary.length > 0 && (
            <input
              aria-label={t.specSearchPlaceholder}
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder={t.specSearchPlaceholder}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            />
          )}
          {techLibrary.length === 0 ? (
            <div style={{ color: COLORS.muted }} className="text-xs text-center py-6">
              {t.noLibraryItemsYet}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {techLibrary
                .filter((it) => {
                  const q = librarySearch.trim().toLowerCase();
                  if (!q) return true;
                  return [it.name, it.supplier, it.articleNumber]
                    .filter(Boolean)
                    .some((f) => f.toLowerCase().includes(q));
                })
                .map((it) => (
                  <div
                    key={it.id}
                    style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                    className="rounded-xl p-3 flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{it.name}</div>
                        {(it.supplier || it.articleNumber) && (
                          <div style={{ color: COLORS.muted }} className="text-xs truncate">
                            {[it.supplier, it.articleNumber].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="tap"
                          aria-label={t.a11yEdit}
                          title={t.a11yEdit}
                          onClick={() => openLibraryEdit(it)}
                          style={{ color: COLORS.muted }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="tap"
                          aria-label={t.a11yDelete}
                          title={t.a11yDelete}
                          onClick={() => deleteLibraryItem(it.id)}
                          style={{ color: COLORS.danger }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    {it.specs && it.specs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {it.specs.map((s) => (
                          <span
                            key={s.id}
                            style={{ background: COLORS.cardAlt, color: COLORS.muted }}
                            className="text-xs rounded-md px-2 py-1"
                          >
                            <b style={{ color: COLORS.text }}>{s.key}:</b> {s.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {materialsSubTab !== "transport" && materialsSubTab !== "library" && basket.length > 0 && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide flex items-center gap-1">
              <ShoppingCart size={13} /> {t.basketLabel} ({basket.length})
            </div>
            <button
              onClick={() => setBasket([])}
              style={{ color: COLORS.danger }}
              className="text-xs font-bold uppercase"
            >
              {t.clearBasketBtn}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {basket.map((i) => (
              <div key={i.id} className="flex items-center gap-2">
                <span
                  {...materialDragProps(i.name, i.kind, { qty: i.qty, unit: i.unit, basketId: i.id })}
                  className="flex-1 text-sm truncate flex items-center gap-1 cursor-grab active:cursor-grabbing select-none"
                >
                  <GripVertical size={12} color={COLORS.muted} className="shrink-0" /> {i.name}
                </span>
                <input
                  value={i.qty}
                  onChange={(e) => updateBasketItem(i.id, "qty", e.target.value)}
                  inputMode="decimal"
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="w-12 text-xs rounded px-1.5 py-1.5 outline-none"
                />
                <input
                  aria-label={t.unitPlaceholder}
                  value={i.unit}
                  onChange={(e) => updateBasketItem(i.id, "unit", e.target.value)}
                  placeholder={t.unitPlaceholder}
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="w-16 text-xs rounded px-1.5 py-1.5 outline-none"
                />
                <button
                  className="tap"
                  aria-label={t.a11yClose}
                  title={t.a11yClose}
                  onClick={() => removeBasketItem(i.id)}
                  style={{ color: COLORS.muted }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => {
                setBasketMode("use");
                setBasketProjectModalOpen(true);
              }}
              style={{ background: COLORS.accent }}
              className="py-2.5 rounded-lg text-xs font-bold uppercase"
            >
              {t.transferToProjectBtn}
            </button>
            <button
              onClick={() => {
                setBasketMode("order");
                setBasketProjectModalOpen(true);
              }}
              style={{ background: COLORS.cardAlt, border: `1px solid #C68B4F`, color: "#C68B4F" }}
              className="py-2.5 rounded-lg text-xs font-bold uppercase"
            >
              {t.requestOrderBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
