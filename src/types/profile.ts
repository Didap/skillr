export interface Profile {
  id: string;
  name: string;
  title: string;
  rate: string;
  location: string;
  skills: string[];
  image: string | null;
  bioShort?: string;
  type: "professional" | "company";
}
