import React, { createContext, useContext, useState } from "react";
import { siteConfig } from "config/site.config";

interface FilterInitialType {
  searchText: string;
  postTopic: TopicType;
  onSearch?: (val: string) => void;
  onTopicChange?: (val: TopicType) => void;
}

export type TopicType = typeof siteConfig.blog.defaultTopics[number];

export const filterContext = createContext<FilterInitialType>({
  searchText: "",
  postTopic: "All",
});

export const ProvideFilter = ({ children }: { children: React.ReactNode }) => {
  const value = useProvideFilter();
  return (
    <filterContext.Provider value={value}>{children}</filterContext.Provider>
  );
};

export const useFilter = () => useContext(filterContext);

const useProvideFilter = () => {
  const [searchText, setSearchText] = useState("");
  const [postTopic, setPostTopic] = useState<TopicType>("All");

  const onSearch = (val: string) => {
    setSearchText(val);
  };

  const onTopicChange = (val: TopicType) => {
    setPostTopic(val);
  };

  return {
    searchText,
    postTopic,
    onSearch,
    onTopicChange,
  };
};
