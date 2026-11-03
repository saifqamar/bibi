import { useSearch } from "@bibi/query-hooks";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { SeriesCard } from "@/components/SeriesCard";
import { Empty, Field, Loading, Screen, Title } from "@/components/ui";

export default function Search() {
  const [q, setQ] = useState("");
  const results = useSearch(q);
  return (
    <Screen>
      <View className="gap-4 px-4 py-4">
        <Title>Search</Title>
        <Field
          label="Search by title"
          placeholder="e.g. The Lighthouse"
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
        />
      </View>
      {q.trim() && results.isPending ? (
        <Loading />
      ) : q.trim() && (results.data ?? []).length === 0 ? (
        <Empty title="Nothing found" hint="Try another title." />
      ) : (
        <FlatList
          data={results.data ?? []}
          keyExtractor={(s) => s.id}
          numColumns={2}
          columnWrapperClassName="gap-4 px-4"
          contentContainerClassName="gap-6 pb-8"
          renderItem={({ item }) => <SeriesCard series={item} width={160} />}
        />
      )}
    </Screen>
  );
}
