export interface ConversationSuggestion {
  topic: string;
  message: string;
  icon: string;
}

export interface ConversationSuggestionsResponse {
  suggestions: ConversationSuggestion[];
}
