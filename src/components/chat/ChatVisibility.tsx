"use client";

import { createContext, useContext } from "react";

/** False while the thread is mounted but hidden (the "Dettagli" tab on phones). */
export const ChatVisibilityContext = createContext(true);
export const useChatVisible = () => useContext(ChatVisibilityContext);
