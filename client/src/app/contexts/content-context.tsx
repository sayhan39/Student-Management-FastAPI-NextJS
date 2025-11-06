"use client"

import { createContext, ReactNode, useContext, useState } from "react";
import { ContentMetadata } from "../(contents)/content";

type ContentContextType = {
    contents: ContentMetadata[];
    setContents: (contents: ContentMetadata[]) => void;
    selectedContent: ContentMetadata | null;
    setSelectedContent: (course: ContentMetadata | null) => void;
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

const ContentContextProvider = ({ children }: { children: ReactNode }) => {
    const [contents, setContents] = useState<ContentMetadata[]>([]);
    const [selectedContent, setSelectedContent] = useState<ContentMetadata | null>(null);

    return (
        <ContentContext.Provider value={{
            contents,
            setContents,
            selectedContent,
            setSelectedContent
        }}>
            {children}
        </ContentContext.Provider>
    );
};

const useContent = () => {
    const context = useContext(ContentContext);
    if (context === undefined) {
        throw new Error("useContent must be used within a ContentContextProvider");
    }
    return context;
};

export { ContentContextProvider, useContent };
