export type Status = "todo" | "in-progress" | "done";

export type StatusColumnType = {
  id: Status;
  name: string;
  description: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  status: Status;
};

// export const mockTasks: Task[] = [
//   { id: "1", title: "Task One", status: "todo" },
//   { id: "2", title: "Task Two", status: "in-progress" },
//   { id: "3", title: "Task Three", status: "done" },
//   { id: "4", title: "Task Four", status: "todo" },
//   { id: "5", title: "Task Five", status: "in-progress" },
//   { id: "6", title: "Task Six", status: "done" },
//   // Generate 100 more tasks for testing
//   ...Array.from({ length: 100 }, (_, i) => ({
//     id: (7 + i).toString(),
//     title: `Task ${7 + i}`,
//     status: (["todo", "in-progress", "done"] as Status[])[
//       Math.floor(Math.random() * 3)
//     ],
//   })),
// ];

// save mockTasks to the data.ts file with bun
// Bun.write("data.json", JSON.stringify(mockTasks, null, 2));
export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Task 1",
    status: "todo",
  },
  {
    id: "2",
    title: "Task 2",
    status: "in-progress",
  },
  {
    id: "3",
    title: "Task 3",
    status: "done",
  },
  {
    id: "4",
    title: "Task 4",
    status: "todo",
  },
  {
    id: "5",
    title: "Task 5",
    status: "in-progress",
  },
  {
    id: "6",
    title: "Task 6",
    status: "done",
  },
  {
    id: "7",
    title: "Task 7",
    status: "done",
  },
  // {
  //   id: "8",
  //   title: "Task 8",
  //   status: "done",
  // },
  // {
  //   id: "9",
  //   title: "Task 9",
  //   status: "todo",
  // },
  // {
  //   id: "10",
  //   title: "Task 10",
  //   status: "done",
  // },
  // {
  //   id: "11",
  //   title: "Task 11",
  //   status: "in-progress",
  // },
  // {
  //   id: "12",
  //   title: "Task 12",
  //   status: "todo",
  // },
  // {
  //   id: "13",
  //   title: "Task 13",
  //   status: "in-progress",
  // },
  // {
  //   id: "14",
  //   title: "Task 14",
  //   status: "todo",
  // },
  // {
  //   id: "15",
  //   title: "Task 15",
  //   status: "done",
  // },
  // {
  //   id: "16",
  //   title: "Task 16",
  //   status: "done",
  // },
  // {
  //   id: "17",
  //   title: "Task 17",
  //   status: "in-progress",
  // },
  // {
  //   id: "18",
  //   title: "Task 18",
  //   status: "done",
  // },
  // {
  //   id: "19",
  //   title: "Task 19",
  //   status: "todo",
  // },
  // {
  //   id: "20",
  //   title: "Task 20",
  //   status: "todo",
  // },
  // {
  //   id: "21",
  //   title: "Task 21",
  //   status: "done",
  // },
  // {
  //   id: "22",
  //   title: "Task 22",
  //   status: "done",
  // },
  // {
  //   id: "23",
  //   title: "Task 23",
  //   status: "todo",
  // },
  // {
  //   id: "24",
  //   title: "Task 24",
  //   status: "in-progress",
  // },
  // {
  //   id: "25",
  //   title: "Task 25",
  //   status: "done",
  // },
  // {
  //   id: "26",
  //   title: "Task 26",
  //   status: "in-progress",
  // },
  // {
  //   id: "27",
  //   title: "Task 27",
  //   status: "in-progress",
  // },
  // {
  //   id: "28",
  //   title: "Task 28",
  //   status: "in-progress",
  // },
  // {
  //   id: "29",
  //   title: "Task 29",
  //   status: "todo",
  // },
  // {
  //   id: "30",
  //   title: "Task 30",
  //   status: "in-progress",
  // },
  // {
  //   id: "31",
  //   title: "Task 31",
  //   status: "todo",
  // },
  // {
  //   id: "32",
  //   title: "Task 32",
  //   status: "todo",
  // },
  // {
  //   id: "33",
  //   title: "Task 33",
  //   status: "todo",
  // },
  // {
  //   id: "34",
  //   title: "Task 34",
  //   status: "done",
  // },
  // {
  //   id: "35",
  //   title: "Task 35",
  //   status: "done",
  // },
  // {
  //   id: "36",
  //   title: "Task 36",
  //   status: "todo",
  // },
  // {
  //   id: "37",
  //   title: "Task 37",
  //   status: "todo",
  // },
  // {
  //   id: "38",
  //   title: "Task 38",
  //   status: "todo",
  // },
  // {
  //   id: "39",
  //   title: "Task 39",
  //   status: "in-progress",
  // },
  // {
  //   id: "40",
  //   title: "Task 40",
  //   status: "in-progress",
  // },
  // {
  //   id: "41",
  //   title: "Task 41",
  //   status: "todo",
  // },
  // {
  //   id: "42",
  //   title: "Task 42",
  //   status: "todo",
  // },
  // {
  //   id: "43",
  //   title: "Task 43",
  //   status: "todo",
  // },
  // {
  //   id: "44",
  //   title: "Task 44",
  //   status: "done",
  // },
  // {
  //   id: "45",
  //   title: "Task 45",
  //   status: "in-progress",
  // },
  // {
  //   id: "46",
  //   title: "Task 46",
  //   status: "in-progress",
  // },
  // {
  //   id: "47",
  //   title: "Task 47",
  //   status: "in-progress",
  // },
  // {
  //   id: "48",
  //   title: "Task 48",
  //   status: "in-progress",
  // },
  // {
  //   id: "49",
  //   title: "Task 49",
  //   status: "todo",
  // },
  // {
  //   id: "50",
  //   title: "Task 50",
  //   status: "in-progress",
  // },
  // {
  //   id: "51",
  //   title: "Task 51",
  //   status: "in-progress",
  // },
  // {
  //   id: "52",
  //   title: "Task 52",
  //   status: "todo",
  // },
  // {
  //   id: "53",
  //   title: "Task 53",
  //   status: "in-progress",
  // },
  // {
  //   id: "54",
  //   title: "Task 54",
  //   status: "in-progress",
  // },
  // {
  //   id: "55",
  //   title: "Task 55",
  //   status: "todo",
  // },
  // {
  //   id: "56",
  //   title: "Task 56",
  //   status: "todo",
  // },
  // {
  //   id: "57",
  //   title: "Task 57",
  //   status: "in-progress",
  // },
  // {
  //   id: "58",
  //   title: "Task 58",
  //   status: "in-progress",
  // },
  // {
  //   id: "59",
  //   title: "Task 59",
  //   status: "done",
  // },
  // {
  //   id: "60",
  //   title: "Task 60",
  //   status: "done",
  // },
  // {
  //   id: "61",
  //   title: "Task 61",
  //   status: "in-progress",
  // },
  // {
  //   id: "62",
  //   title: "Task 62",
  //   status: "done",
  // },
  // {
  //   id: "63",
  //   title: "Task 63",
  //   status: "todo",
  // },
  // {
  //   id: "64",
  //   title: "Task 64",
  //   status: "todo",
  // },
  // {
  //   id: "65",
  //   title: "Task 65",
  //   status: "in-progress",
  // },
  // {
  //   id: "66",
  //   title: "Task 66",
  //   status: "todo",
  // },
  // {
  //   id: "67",
  //   title: "Task 67",
  //   status: "todo",
  // },
  // {
  //   id: "68",
  //   title: "Task 68",
  //   status: "in-progress",
  // },
  // {
  //   id: "69",
  //   title: "Task 69",
  //   status: "in-progress",
  // },
  // {
  //   id: "70",
  //   title: "Task 70",
  //   status: "done",
  // },
  // {
  //   id: "71",
  //   title: "Task 71",
  //   status: "in-progress",
  // },
  // {
  //   id: "72",
  //   title: "Task 72",
  //   status: "done",
  // },
  // {
  //   id: "73",
  //   title: "Task 73",
  //   status: "done",
  // },
  // {
  //   id: "74",
  //   title: "Task 74",
  //   status: "done",
  // },
  // {
  //   id: "75",
  //   title: "Task 75",
  //   status: "in-progress",
  // },
  // {
  //   id: "76",
  //   title: "Task 76",
  //   status: "done",
  // },
  // {
  //   id: "77",
  //   title: "Task 77",
  //   status: "in-progress",
  // },
  // {
  //   id: "78",
  //   title: "Task 78",
  //   status: "todo",
  // },
  // {
  //   id: "79",
  //   title: "Task 79",
  //   status: "done",
  // },
  // {
  //   id: "80",
  //   title: "Task 80",
  //   status: "in-progress",
  // },
  // {
  //   id: "81",
  //   title: "Task 81",
  //   status: "todo",
  // },
  // {
  //   id: "82",
  //   title: "Task 82",
  //   status: "todo",
  // },
  // {
  //   id: "83",
  //   title: "Task 83",
  //   status: "todo",
  // },
  // {
  //   id: "84",
  //   title: "Task 84",
  //   status: "in-progress",
  // },
  // {
  //   id: "85",
  //   title: "Task 85",
  //   status: "in-progress",
  // },
  // {
  //   id: "86",
  //   title: "Task 86",
  //   status: "done",
  // },
  // {
  //   id: "87",
  //   title: "Task 87",
  //   status: "in-progress",
  // },
  // {
  //   id: "88",
  //   title: "Task 88",
  //   status: "in-progress",
  // },
  // {
  //   id: "89",
  //   title: "Task 89",
  //   status: "todo",
  // },
  // {
  //   id: "90",
  //   title: "Task 90",
  //   status: "done",
  // },
  // {
  //   id: "91",
  //   title: "Task 91",
  //   status: "todo",
  // },
  // {
  //   id: "92",
  //   title: "Task 92",
  //   status: "in-progress",
  // },
  // {
  //   id: "93",
  //   title: "Task 93",
  //   status: "done",
  // },
  // {
  //   id: "94",
  //   title: "Task 94",
  //   status: "done",
  // },
  // {
  //   id: "95",
  //   title: "Task 95",
  //   status: "in-progress",
  // },
  // {
  //   id: "96",
  //   title: "Task 96",
  //   status: "in-progress",
  // },
  // {
  //   id: "97",
  //   title: "Task 97",
  //   status: "done",
  // },
  // {
  //   id: "98",
  //   title: "Task 98",
  //   status: "done",
  // },
  // {
  //   id: "99",
  //   title: "Task 99",
  //   status: "in-progress",
  // },
  // {
  //   id: "100",
  //   title: "Task 100",
  //   status: "in-progress",
  // },
  // {
  //   id: "101",
  //   title: "Task 101",
  //   status: "in-progress",
  // },
  // {
  //   id: "102",
  //   title: "Task 102",
  //   status: "todo",
  // },
  // {
  //   id: "103",
  //   title: "Task 103",
  //   status: "in-progress",
  // },
  // {
  //   id: "104",
  //   title: "Task 104",
  //   status: "in-progress",
  // },
  // {
  //   id: "105",
  //   title: "Task 105",
  //   status: "todo",
  // },
  // {
  //   id: "106",
  //   title: "Task 106",
  //   status: "in-progress",
  // },
];
