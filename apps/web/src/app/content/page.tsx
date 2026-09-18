"use client";

import ContentGraph from "@/features/content/components/ContentGraph";
import TechnologyGraph from "@/features/content/components/TechnologyGraph";
import { useState } from "react";

export default function ContentPage() {
  const [tab, setTab] = useState<"entities" | "techtree">("entities");
  return tab === "entities"
    ? <ContentGraph activeTab={tab} onTabChange={setTab} />
    : <TechnologyGraph activeTab={tab} onTabChange={setTab} />;
}
