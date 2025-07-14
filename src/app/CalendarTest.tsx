import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useState } from "react";

export default function CalendarTest() {
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  return (
    <div style={{ width: 500, margin: "100px auto" }}>
      <DateRange
        editableDateInputs={true}
        onChange={item => {
          const sel = item.selection;
          setRange([
            {
              startDate: sel.startDate ? new Date(sel.startDate) : new Date(),
              endDate: sel.endDate ? new Date(sel.endDate) : new Date(),
              key: "selection",
            },
          ]);
        }}
        moveRangeOnFirstSelection={false}
        ranges={range}
      />
    </div>
  );
} 