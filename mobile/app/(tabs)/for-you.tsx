import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  Clock,
  FolderPlus,
  Sparkles,
  Star,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { api } from "@/lib/api-client";
import type {
  CollectionListPublic,
  CollectionPublic,
  MediaType,
  WatchedMoviesPublic,
  WatchlistItemsPublic,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { MediaDetailSheet } from "@/components/MediaDetailSheet";
import { posterUrl } from "@/lib/image-urls";
import { showCollectionPicker } from "@/lib/collection-picker";

// ── Types ─────────────────────────────────────────────────────────────────────

type QuestionResponse = {
  session_id: string;
  phase: "questioning";
  step: number;
  total_steps: number;
  question: string;
  options: string[] | null;
  history_token: string;
};

type RecommendationTicket = {
  tmdb_id: number;
  media_type: "movie" | "series";
  title: string;
  year: number | null;
  runtime_minutes: number | null;
  poster_path: string | null;
  genres: string[];
  tmdb_rating: number | null;
  reason: string;
};

type AnswerResponse =
  | QuestionResponse
  | { session_id: string; phase: "complete"; recommendations: RecommendationTicket[] };

// ── State machine ─────────────────────────────────────────────────────────────

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "questioning"; data: QuestionResponse }
  | { phase: "answering"; data: QuestionResponse }
  | { phase: "discovering"; tickets: RecommendationTicket[] }
  | { phase: "revealing"; tickets: RecommendationTicket[] }
  | { phase: "error"; message: string };

type Action =
  | { type: "START" }
  | { type: "SESSION_STARTED"; data: QuestionResponse }
  | { type: "SUBMIT_ANSWER" }
  | { type: "GOT_QUESTION"; data: QuestionResponse }
  | { type: "GOT_RECOMMENDATIONS"; tickets: RecommendationTicket[] }
  | { type: "REVEAL_RECOMMENDATIONS" }
  | { type: "ERROR"; message: string }
  | { type: "RESTART" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return { phase: "loading" };
    case "SESSION_STARTED":
      return { phase: "questioning", data: action.data };
    case "SUBMIT_ANSWER":
      if (state.phase !== "questioning") return state;
      return { phase: "answering", data: state.data };
    case "GOT_QUESTION":
      return { phase: "questioning", data: action.data };
    case "GOT_RECOMMENDATIONS":
      return { phase: "discovering", tickets: action.tickets };
    case "REVEAL_RECOMMENDATIONS":
      if (state.phase !== "discovering") return state;
      return { phase: "revealing", tickets: state.tickets };
    case "ERROR":
      return { phase: "error", message: action.message };
    case "RESTART":
      return { phase: "idle" };
    default:
      return state;
  }
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

const DISCOVERING_MESSAGES = [
  "Analyzing your answers...",
  "Consulting the archives...",
  "Finding perfect matches...",
  "Crossing genres...",
  "Preparing your tickets...",
];

function DiscoveringLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setMessageIndex((prev) => (prev + 1) % DISCOVERING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, padding: 24 }}>
      <View style={{ width: 64, height: 64, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
      <Animated.Text
        style={{
          opacity: fadeAnim,
          fontSize: 14,
          fontWeight: "500",
          color: "#fafafa",
          textAlign: "center",
        }}
      >
        {DISCOVERING_MESSAGES[messageIndex]}
      </Animated.Text>
    </View>
  );
}

function WelcomeScreen({
  onStart,
  isLoading,
}: {
  onStart: () => void;
  isLoading: boolean;
}) {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 36, paddingHorizontal: 24, paddingVertical: 48 }}>
        <View style={{ alignItems: "center", gap: 16 }}>
          <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: "rgba(225,29,72,0.1)", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={40} color="#e11d48" />
          </View>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#fafafa" }}>For You</Text>
            <Text style={{ fontSize: 15, color: "#71717a", textAlign: "center", maxWidth: 280, lineHeight: 22 }}>
              Answer a few quick questions and get 3 hand-picked recommendations
              from your personal AI curator.
            </Text>
          </View>
        </View>

        <View style={{ gap: 16, width: "100%", maxWidth: 280 }}>
          {[
            "Answer 4–6 quick questions",
            "AI picks 3 titles just for you",
            "Get your tickets and start watching",
          ].map((step, i) => (
            <View key={step} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#18181b", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#27272a" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#fafafa" }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 14, color: "#a1a1aa", flex: 1 }}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={{ width: "100%", maxWidth: 280 }}>
          <Button onPress={onStart} loading={isLoading} disabled={isLoading}>
            {isLoading ? "Loading…" : "Get My Picks"}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

// ── WizardCard: multi-select chips ────────────────────────────────────────────

function WizardCard({
  question,
  onAnswer,
  isSubmitting,
}: {
  question: QuestionResponse;
  onAnswer: (answer: string) => void;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const progress = (question.step / question.total_steps) * 100;

  const toggleChip = (option: string) => {
    if (isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
    setFreeText("");
  };

  const handleSubmitChips = () => {
    if (selected.length === 0 || isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAnswer(selected.join(", "));
  };

  const handleSubmitText = () => {
    const text = freeText.trim();
    if (!text || isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAnswer(text);
  };

  const hasSelection = selected.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: "#71717a" }}>
              Question {question.step} of {question.total_steps}
            </Text>
            <Text style={{ fontSize: 12, color: "#71717a" }}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: "#27272a", overflow: "hidden" }}>
            <View style={{ height: 4, width: `${progress}%`, borderRadius: 2, backgroundColor: "#e11d48" }} />
          </View>
        </View>

        {/* Question */}
        <View style={{ gap: 20, borderRadius: 20, borderWidth: 1, borderColor: "#27272a", backgroundColor: "#111114", padding: 20, overflow: "hidden" }}>
          {/* Thinking overlay */}
          {isSubmitting && (
            <View style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 10, backgroundColor: "rgba(9,9,11,0.75)",
              borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 10
            }}>
              <ActivityIndicator size="small" color="#e11d48" />
              <Text style={{ fontSize: 13, fontWeight: "500", color: "#fafafa" }}>Thinking…</Text>
            </View>
          )}

          <Text style={{ fontSize: 18, fontWeight: "600", color: "#fafafa", lineHeight: 26 }}>
            {question.question}
          </Text>

          {/* Multi-select chips */}
          {question.options ? (
            <View style={{ gap: 10 }}>
              {question.options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => toggleChip(option)}
                    disabled={isSubmitting}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#e11d48" : "#2a2a36",
                      backgroundColor: isSelected ? "rgba(225,29,72,0.07)" : "#0d0d10",
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      opacity: isSubmitting ? 0.5 : pressed ? 0.75 : 1,
                    })}
                  >
                    {/* Checkbox */}
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: "#3f3f46",
                      backgroundColor: isSelected ? "#e11d48" : "transparent",
                      alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                    </View>

                    <Text style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: isSelected ? "600" : "400",
                      color: isSelected ? "#f1f1f1" : "#a1a1aa",
                      lineHeight: 20,
                    }}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Continue button — appears when at least one selected */}
              {hasSelection && (
                <Pressable
                  onPress={handleSubmitChips}
                  disabled={isSubmitting}
                  style={({ pressed }) => ({
                    marginTop: 4,
                    borderRadius: 14,
                    backgroundColor: "#e11d48",
                    paddingVertical: 14,
                    alignItems: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                    Continue
                    {selected.length > 1 ? ` (${selected.length} selected)` : ""}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {/* Free text fallback */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              placeholder={question.options ? "Or type your own answer…" : "Type your answer…"}
              placeholderTextColor="#52525b"
              value={freeText}
              onChangeText={setFreeText}
              onSubmitEditing={handleSubmitText}
              editable={!isSubmitting}
              returnKeyType="send"
              style={{
                flex: 1,
                backgroundColor: "#0d0d10",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 13,
                color: "#fafafa",
                fontSize: 14,
                borderWidth: 1,
                borderColor: "#2a2a36",
              }}
            />
            <Pressable
              onPress={handleSubmitText}
              disabled={!freeText.trim() || isSubmitting}
              style={({ pressed }) => ({
                width: 48, height: 48, borderRadius: 12,
                backgroundColor: "#e11d48",
                alignItems: "center", justifyContent: "center",
                opacity: !freeText.trim() || isSubmitting ? 0.35 : pressed ? 0.8 : 1,
              })}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ArrowRight size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Recommendation Ticket Card ─────────────────────────────────────────────────

const AMBER = "#f59e0b";

function RecommendationTicketCard({
  ticket,
  index,
  isInWatchlist,
  isWatched,
  collections,
  onAddToWatchlist,
  onAddToCollection,
  isActionLoading,
  onPress,
}: {
  ticket: RecommendationTicket;
  index: number;
  isInWatchlist: boolean;
  isWatched: boolean;
  collections: CollectionPublic[];
  onAddToWatchlist: () => void;
  onAddToCollection: () => void;
  isActionLoading: boolean;
  onPress: () => void;
}) {
  const imgUri = ticket.poster_path ? posterUrl(ticket.poster_path, "w342") : null;
  const ratingDisplay = ticket.tmdb_rating ? ticket.tmdb_rating.toFixed(1) : null;
  const runtime = ticket.runtime_minutes
    ? `${Math.floor(ticket.runtime_minutes / 60)}h ${ticket.runtime_minutes % 60}m`
    : null;

  // Ticket number label (e.g. #01, #02, #03)
  const ticketNum = `#${String(index + 1).padStart(2, "0")}`;

  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#2a2a36", backgroundColor: "#111114" }}>

      {/* ── TOP HALF: poster + movie info ── */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: "row",
          borderTopLeftRadius: 19,
          borderTopRightRadius: 19,
          overflow: "hidden",
          opacity: pressed ? 0.88 : 1,
        })}
      >
        {/* Poster */}
        <View style={{ width: 120, minHeight: 180, backgroundColor: "#1a1a1f" }}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 11, color: "#52525b" }}>No poster</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, padding: 16, gap: 10, justifyContent: "space-between" }}>
          {/* Ticket number badge */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(225,29,72,0.12)", borderWidth: 1, borderColor: "rgba(225,29,72,0.25)" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#e11d48", letterSpacing: 0.5 }}>
                {ticketNum}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "#1e1e24", borderWidth: 1, borderColor: "#2a2a36" }}>
              <Text style={{ fontSize: 10, color: "#71717a", fontWeight: "500" }}>
                {ticket.media_type === "series" ? "Series" : "Film"}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fafafa", lineHeight: 22 }} numberOfLines={3}>
            {ticket.title}
          </Text>

          {/* Year + Runtime */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {ticket.year ? (
              <Text style={{ fontSize: 12, color: "#71717a", fontWeight: "500" }}>{ticket.year}</Text>
            ) : null}
            {runtime ? (
              <>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#3f3f46" }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Clock size={11} color="#52525b" />
                  <Text style={{ fontSize: 12, color: "#71717a" }}>{runtime}</Text>
                </View>
              </>
            ) : null}
            {ratingDisplay ? (
              <>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#3f3f46" }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Star size={11} color={AMBER} fill={AMBER} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: AMBER }}>{ratingDisplay}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Genres */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
            {ticket.genres.slice(0, 3).map((g) => (
              <View key={g} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: "#1e1e24", borderWidth: 1, borderColor: "#2a2a36" }}>
                <Text style={{ fontSize: 10, color: "#a1a1aa" }}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>

      {/* ── PERFORATED TEAR LINE ── */}
      <View style={{ height: 24, flexDirection: "row", alignItems: "center", position: "relative" }}>
        {/* Left semicircle notch */}
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: "#09090b",
          position: "absolute", left: -12, zIndex: 2,
        }} />
        {/* Dashed line */}
        <View style={{
          flex: 1,
          borderTopWidth: 1,
          borderColor: "#2a2a36",
          borderStyle: "dashed",
          marginHorizontal: 14,
        }} />
        {/* Right semicircle notch */}
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: "#09090b",
          position: "absolute", right: -12, zIndex: 2,
        }} />
      </View>

      {/* ── BOTTOM STUB: reason + actions ── */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
        {/* AI reason */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: "600", color: "#52525b", letterSpacing: 0.8, textTransform: "uppercase" }}>
            Why you'll love it
          </Text>
          <Text style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 19, fontStyle: "italic" }}>
            "{ticket.reason}"
          </Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => {
              if (!isInWatchlist && !isWatched && !isActionLoading) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddToWatchlist();
              }
            }}
            disabled={isInWatchlist || isWatched || isActionLoading}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isInWatchlist || isWatched ? "#27272a" : "#e11d48",
              backgroundColor: isInWatchlist || isWatched ? "transparent" : "rgba(225,29,72,0.08)",
              paddingVertical: 10,
              opacity: isInWatchlist || isWatched ? 0.5 : pressed ? 0.75 : 1,
            })}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color="#e11d48" />
            ) : isInWatchlist ? (
              <>
                <Clock size={13} color="#71717a" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717a" }}>In Watchlist</Text>
              </>
            ) : isWatched ? (
              <>
                <Check size={13} color="#71717a" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717a" }}>Watched</Text>
              </>
            ) : (
              <>
                <BookmarkPlus size={13} color="#e11d48" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#e11d48" }}>Add to Watchlist</Text>
              </>
            )}
          </Pressable>

          {collections.length > 0 && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddToCollection();
              }}
              disabled={isActionLoading}
              style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 12,
                backgroundColor: "#1e1e24",
                borderWidth: 1, borderColor: "#2a2a36",
                alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <FolderPlus size={16} color="#a1a1aa" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function ForYouScreen() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });
  const [selectedTicket, setSelectedTicket] = useState<RecommendationTicket | null>(null);
  const [actionTmdbId, setActionTmdbId] = useState<number | null>(null);

  const { data: watchlist } = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () =>
      api<WatchlistItemsPublic>("/collections/watchlist", { query: { skip: 0, limit: 200 } }),
  });

  const { data: watched } = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () =>
      api<WatchedMoviesPublic>("/collections/watched", { query: { skip: 0, limit: 200 } }),
  });

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: () =>
      api<CollectionListPublic>("/collections/named", { query: { skip: 0, limit: 50 } }),
  });

  const watchlistByTmdbId = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of watchlist?.data ?? []) {
      const tmdbId = item.media?.tmdb_id;
      if (typeof tmdbId === "number") map.set(tmdbId, item.id);
    }
    return map;
  }, [watchlist?.data]);

  const watchedByTmdbId = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of watched?.data ?? []) {
      const tmdbId = item.media?.tmdb_id;
      if (typeof tmdbId === "number") map.set(tmdbId, item.id);
    }
    return map;
  }, [watched?.data]);

  const addToWatchlistMutation = useMutation({
    mutationFn: (payload: { tmdbId: number; mediaType: MediaType }) =>
      api("/collections/watchlist", {
        method: "POST",
        body: { tmdb_id: payload.tmdbId, media_type: payload.mediaType },
      }),
    onSettled: async () => {
      setActionTmdbId(null);
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] });
    },
  });

  const addToCollectionMutation = useMutation({
    mutationFn: (payload: { collectionId: string; tmdbId: number; mediaType: MediaType }) =>
      api(`/collections/named/${payload.collectionId}/items`, {
        method: "POST",
        body: { tmdb_id: payload.tmdbId, media_type: payload.mediaType, rating: null },
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const userCollections = collections?.data ?? [];

  async function handleStart() {
    dispatch({ type: "START" });
    try {
      const data = await api<QuestionResponse>("/recommendations/sessions", { method: "POST" });
      dispatch({ type: "SESSION_STARTED", data });
    } catch {
      dispatch({ type: "RESTART" });
    }
  }

  async function handleAnswer(answer: string) {
    if (state.phase !== "questioning") return;
    const { session_id, history_token } = state.data;
    dispatch({ type: "SUBMIT_ANSWER" });

    try {
      const res = await api<AnswerResponse>(
        `/recommendations/sessions/${session_id}/answer`,
        { method: "POST", body: { answer, history_token } }
      );

      if (res.phase === "complete") {
        dispatch({ type: "GOT_RECOMMENDATIONS", tickets: res.recommendations });
        setTimeout(() => dispatch({ type: "REVEAL_RECOMMENDATIONS" }), 3000);
      } else {
        dispatch({ type: "GOT_QUESTION", data: res as QuestionResponse });
      }
    } catch {
      dispatch({ type: "ERROR", message: "Something went wrong. Please try again." });
    }
  }

  const tickets = state.phase === "revealing" ? state.tickets : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#09090b" }} edges={["top"]}>
      {(state.phase === "idle" || state.phase === "loading") && (
        <WelcomeScreen onStart={handleStart} isLoading={state.phase === "loading"} />
      )}

      {(state.phase === "questioning" || state.phase === "answering") && (
        <WizardCard
          key={state.data.step}
          question={state.data}
          onAnswer={handleAnswer}
          isSubmitting={state.phase === "answering"}
        />
      )}

      {state.phase === "discovering" && <DiscoveringLoader />}

      {state.phase === "revealing" && (
        <FlatList
          data={tickets}
          keyExtractor={(t) => String(t.tmdb_id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 }}
          ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ alignItems: "center", gap: 6, marginBottom: 24 }}>
              <Text style={{ fontSize: 24, fontWeight: "700", color: "#fafafa" }}>
                Your picks are ready
              </Text>
              <Text style={{ fontSize: 13, color: "#71717a" }}>
                Curated just for you · {tickets.length} tickets
              </Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              onPress={() => dispatch({ type: "RESTART" })}
              style={({ pressed }) => ({ alignItems: "center", paddingTop: 20, opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ fontSize: 13, color: "#52525b", textDecorationLine: "underline" }}>
                Start over
              </Text>
            </Pressable>
          }
          renderItem={({ item: ticket, index }) => (
            <RecommendationTicketCard
              ticket={ticket}
              index={index}
              isInWatchlist={watchlistByTmdbId.has(ticket.tmdb_id)}
              isWatched={watchedByTmdbId.has(ticket.tmdb_id)}
              collections={userCollections}
              onAddToWatchlist={() => {
                setActionTmdbId(ticket.tmdb_id);
                addToWatchlistMutation.mutate({ tmdbId: ticket.tmdb_id, mediaType: ticket.media_type });
              }}
              onAddToCollection={() => {
                showCollectionPicker({
                  collections: userCollections,
                  onSelect: (colId) =>
                    addToCollectionMutation.mutate({
                      collectionId: colId,
                      tmdbId: ticket.tmdb_id,
                      mediaType: ticket.media_type,
                    }),
                });
              }}
              isActionLoading={
                (addToWatchlistMutation.isPending || addToCollectionMutation.isPending) &&
                actionTmdbId === ticket.tmdb_id
              }
              onPress={() => setSelectedTicket(ticket)}
            />
          )}
        />
      )}

      {state.phase === "error" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
          <Text style={{ color: "#71717a", textAlign: "center", fontSize: 15 }}>
            {state.message}
          </Text>
          <Pressable
            onPress={() => dispatch({ type: "RESTART" })}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ fontSize: 14, color: "#fafafa", textDecorationLine: "underline" }}>
              Try again
            </Text>
          </Pressable>
        </View>
      )}

      <MediaDetailSheet
        isOpen={selectedTicket !== null}
        mediaId={selectedTicket?.tmdb_id ?? null}
        mediaType={(selectedTicket?.media_type ?? "movie") as MediaType}
        fallbackTitle={selectedTicket?.title ?? undefined}
        fallbackPoster={selectedTicket?.poster_path ?? null}
        fallbackOverview={selectedTicket?.reason ?? null}
        fallbackReleaseDate={null}
        fallbackTmdbRating={selectedTicket?.tmdb_rating ?? null}
        isInWatchlist={
          typeof selectedTicket?.tmdb_id === "number" &&
          watchlistByTmdbId.has(selectedTicket.tmdb_id)
        }
        isWatched={
          typeof selectedTicket?.tmdb_id === "number" &&
          watchedByTmdbId.has(selectedTicket.tmdb_id)
        }
        watchedRating={null}
        collections={userCollections}
        onAddToWatchlist={() => {
          if (typeof selectedTicket?.tmdb_id !== "number") return;
          setActionTmdbId(selectedTicket.tmdb_id);
          addToWatchlistMutation.mutate({ tmdbId: selectedTicket.tmdb_id, mediaType: selectedTicket.media_type });
        }}
        onMarkWatched={() => {}}
        onAddToCollection={(colId) => {
          if (typeof selectedTicket?.tmdb_id !== "number") return;
          addToCollectionMutation.mutate({
            collectionId: colId,
            tmdbId: selectedTicket.tmdb_id,
            mediaType: selectedTicket.media_type,
          });
        }}
        onClose={() => setSelectedTicket(null)}
      />
    </SafeAreaView>
  );
}
