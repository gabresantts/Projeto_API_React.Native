import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  TouchableOpacity,
} from "react-native";

const CORS_PROXY = 'https://corsproxy.io/?';

type ItunesSong = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  releaseDate: string;
  primaryGenreName: string;
};

type GroupedResults = {
  [genre: string]: ItunesSong[];
};

type SectionData = {
    title: string;
    data: ItunesSong[];
}

export default function App() {
  const [songs, setSongs] = useState<ItunesSong[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [message, setMessage] = useState<string>("Digite uma música ou gênero musical e pressione 'Buscar' para começar.");

  async function searchSongs(term: string) {
    if (!term) {
      setMessage("Por favor, digite uma música ou gênero musical para buscar.");
      return;
    }
    
    setLoading(true);
    setSongs([]);
    setMessage("Buscando...");

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song`;
    const url = `${CORS_PROXY}${encodeURIComponent(itunesUrl)}`;

    try {
      const res = await fetch(url);
      const data: { results?: ItunesSong[] } = await res.json();

      if (data && data.results) {
        setSongs(data.results as ItunesSong[]);
        if (data.results.length === 0) {
          setMessage("Nenhum resultado encontrado. Tente outra busca.");
        } else {
          setMessage("");
        }
      } else {
        setMessage("Erro: Resposta da API inesperada. (Tente buscar novamente).");
      }

    } catch (error) {
      setMessage("Não foi possível realizar a busca. Verifique sua conexão ou a estabilidade do servidor.");
    } finally {
      setLoading(false);
    }
  }

  const groupedResults: GroupedResults = useMemo(() => {
    if (songs.length === 0) return {};

    return songs.reduce((acc, item) => {
      const genre = item.primaryGenreName || 'Outro';
      if (!acc[genre]) {
        acc[genre] = [];
      }
      acc[genre].push(item);
      return acc;
    }, {} as GroupedResults);
  }, [songs]);

  const sections: SectionData[] = useMemo(() => {
    return Object.keys(groupedResults).map(genre => ({
      title: genre,
      data: groupedResults[genre],
    }));
  }, [groupedResults]);
  
  const renderMusicCard = ({ item }: { item: ItunesSong }) => {
    const releaseYear = new Date(item.releaseDate).getFullYear();
    
    return (
      <TouchableOpacity style={styles.musicCard}>
        <Image 
          source={{ uri: item.artworkUrl100 }} 
          style={styles.albumImage}
        />
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.trackName}
        </Text>
        <Text style={styles.cardArtist} numberOfLines={1}>
          {item.artistName}
        </Text>
        <Text style={styles.cardYear}>
          Ano: {releaseYear}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const renderGenreSection = ({ item }: { item: SectionData }) => (
    <View style={styles.genreContainer}>
      <Text style={styles.genreTitle}>{item.title}</Text>
      <View style={styles.resultsGrid}>
        {item.data.map(song => (
          <View key={song.trackId}>
            {renderMusicCard({ item: song })}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Buscar músicas..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.input}
          onSubmitEditing={() => searchSongs(searchTerm)}
        />
        <TouchableOpacity
            style={styles.searchButton}
            onPress={() => searchSongs(searchTerm)}
            disabled={loading}
        >
            <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.muted}>{message}</Text>
        </View>
      ) : message && songs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{message}</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={renderGenreSection}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000783ff" 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20
  },
  muted: { 
    color: "#666", 
    marginTop: 10, 
    fontSize: 16,
    textAlign: 'center'
  },
  searchBar: {
    flexDirection: 'row',
    margin: 10,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderColor: "#DDD",
    borderWidth: StyleSheet.hairlineWidth,
    paddingRight: 5,
  },
  input: {
    flex: 1,
    padding: 12,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'center',
    marginRight: 5,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  genreContainer: { 
    marginVertical: 10, 
    marginHorizontal: 10 
  },
  genreTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#666", 
    marginBottom: 10 
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -5,
  },
  musicCard: {
    backgroundColor: "#FFF",
    width: '47%',
    margin: 5,
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  albumImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    borderRadius: 6,
  },
  cardTitle: { 
    fontWeight: "bold", 
    fontSize: 14, 
    marginTop: 8,
    lineHeight: 18,
  },
  cardArtist: { 
    color: "#666", 
    fontSize: 12,
  },
  cardYear: { 
    color: "#666", 
    fontSize: 12,
  },
});