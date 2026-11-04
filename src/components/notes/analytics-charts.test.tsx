import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { ChartTable } from "./analytics-charts";
import { folderChartRows } from "./analytics-data";

describe("ChartTable", () => {
  it("is a real table of the chart's rows, with headers for columns and rows", () => {
    const rows = folderChartRows(
      [
        { id: "work", name: "Work" },
        { id: "travel", name: "Travel" },
      ],
      [{ folderId: "work", notes: 6, words: 1253 }],
    );
    const html = renderToStaticMarkup(
      <ChartTable
        columns={["Folder", "Words"]}
        rows={rows.map((row) => ({ key: row.folderId, cells: [row.name, row.words] }))}
      />,
    );
    expect(html).toContain("<table");
    expect(html.match(/<th scope="col"/g)).toHaveLength(2);
    expect(html).toContain('<th scope="row" class="py-1.5 text-left font-normal">Work</th>');
    expect(html).toContain(">1,253</td>");
    expect(html).toContain(">Travel</th>");
    expect(html).toContain(">0</td>");
  });
});
