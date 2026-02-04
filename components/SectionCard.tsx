import React from "react";

type SectionItem = {
  label: string;
  value: string;
  highlight?: boolean;
};

type SectionCardProps = {
  title: string;
  items: SectionItem[];
};

export default function SectionCard({ title, items }: SectionCardProps) {
  return (
    <section className="section-card">
      <h2 className="section-title">{title}</h2>
      <div className="section-list">
        {items.map((item) => (
          <div className="section-item" key={`${title}-${item.label}`}>
            <strong>{item.label}</strong>
            <span className={item.highlight ? "section-highlight" : undefined}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
