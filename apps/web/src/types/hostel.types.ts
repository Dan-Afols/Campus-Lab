export type BedStatus = "available" | "booked" | "coursemate";

export type HostelBed = {
  id: string;
  number: string;
  status: BedStatus;
};
