// frontend/src/App.jsx
import { useState, useEffect } from "react";
import "./App.css";
import pokeball from "./assets/pokeball.svg";

function App() {
  const [pokemonName, setPokemonName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [pokemon1, setPokemon1] = useState("");
  const [pokemon2, setPokemon2] = useState("");

  const [pokemonData, setPokemonData] = useState(null);
  const [typeData, setTypeData] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [serverStatus, setServerStatus] = useState({
    web: "checking...",
    mcp: "checking...",
  });

  const [loading, setLoading] = useState({
    pokemon: false,
    type: false,
    compare: false,
  });

  const [error, setError] = useState({
    pokemon: null,
    type: null,
    compare: null,
  });

  // Check server status on load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/service/status");
        const data = await response.json();
        setServerStatus({
          web: data.web_service || "error",
          mcp: data.mcp_server || "error",
        });
      } catch (error) {
        console.error(error);
        setServerStatus({
          web: "error",
          mcp: "unreachable",
        });
      }
    };

    checkStatus();
  }, []);

  // Search for a Pokemon
  const searchPokemon = async () => {
    if (!pokemonName.trim()) return;

    setLoading((prev) => ({ ...prev, pokemon: true }));
    setError((prev) => ({ ...prev, pokemon: null }));

    try {
      const response = await fetch(
        `/service/pokemon/${pokemonName.toLowerCase()}`
      );
      const data = await response.json();

      if (data.error) {
        setError((prev) => ({ ...prev, pokemon: data.error }));
        setPokemonData(null);
      } else {
        setPokemonData(data.data);
      }
    } catch (err) {
      setError((prev) => ({ ...prev, pokemon: err.message }));
      setPokemonData(null);
    } finally {
      setLoading((prev) => ({ ...prev, pokemon: false }));
    }
  };

  // Search for Pokemon by type
  const searchType = async () => {
    if (!typeName.trim()) return;

    setLoading((prev) => ({ ...prev, type: true }));
    setError((prev) => ({ ...prev, type: null }));

    try {
      const response = await fetch(
        `/service/pokemon/type/${typeName.toLowerCase()}`
      );
      const data = await response.json();

      if (data.error) {
        setError((prev) => ({ ...prev, type: data.error }));
        setTypeData(null);
      } else {
        setTypeData(data.data);
      }
    } catch (err) {
      setError((prev) => ({ ...prev, type: err.message }));
      setTypeData(null);
    } finally {
      setLoading((prev) => ({ ...prev, type: false }));
    }
  };

  // Compare two Pokemon
  const comparePokemon = async () => {
    if (!pokemon1.trim() || !pokemon2.trim()) return;

    setLoading((prev) => ({ ...prev, compare: true }));
    setError((prev) => ({ ...prev, compare: null }));

    try {
      const response = await fetch(
        `/service/compare/${pokemon1.toLowerCase()}/${pokemon2.toLowerCase()}`
      );
      const data = await response.json();

      if (data.error) {
        setError((prev) => ({ ...prev, compare: data.error }));
        setCompareData(null);
      } else {
        setCompareData(data.data);
      }
    } catch (err) {
      setError((prev) => ({ ...prev, compare: err.message }));
      setCompareData(null);
    } finally {
      setLoading((prev) => ({ ...prev, compare: false }));
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={pokeball} className="logo" alt="Pokeball logo" />
        <h1>PokeAPI MCP Explorer</h1>
      </header>

      <div className="server-status">
        <div
          className={`status-item ${
            serverStatus.web === "operational" ? "status-ok" : "status-error"
          }`}
        >
          Web Service: {serverStatus.web}
        </div>
        <div
          className={`status-item ${
            serverStatus.mcp === "operational" ? "status-ok" : "status-error"
          }`}
        >
          MCP Server: {serverStatus.mcp}
        </div>
      </div>

      <div className="card-grid">
        {/* Pokemon Search Card */}
        <div className="card">
          <h2 className="card-title">Search Pokemon</h2>
          <div className="card-content">
            <div className="search-form">
              <input
                type="text"
                value={pokemonName}
                onChange={(e) => setPokemonName(e.target.value)}
                placeholder="Enter Pokemon name (e.g., pikachu)"
                className="input-field"
              />
              <button
                onClick={searchPokemon}
                disabled={loading.pokemon || !pokemonName.trim()}
                className="search-button"
              >
                {loading.pokemon ? "Loading..." : "Search"}
              </button>
            </div>

            {error.pokemon && (
              <div className="error-message">{error.pokemon}</div>
            )}

            {pokemonData && (
              <div className="pokemon-result">
                <div className="pokemon-header">
                  <h3>{pokemonData.name.toUpperCase()}</h3>
                  <div className="pokemon-id">#{pokemonData.id}</div>
                </div>

                <div className="pokemon-image-container">
                  {pokemonData.sprites?.front && (
                    <img
                      src={pokemonData.sprites.front}
                      alt={pokemonData.name}
                      className="pokemon-image"
                    />
                  )}
                </div>

                <div className="pokemon-types">
                  {pokemonData.types?.map((type, index) => (
                    <span
                      key={index}
                      className={`type-badge type-${type.toLowerCase()}`}
                    >
                      {type}
                    </span>
                  ))}
                </div>

                <div className="pokemon-info">
                  <div className="info-item">
                    Height: {pokemonData.height} m
                  </div>
                  <div className="info-item">
                    Weight: {pokemonData.weight} kg
                  </div>
                  <div className="info-item">
                    Abilities: {pokemonData.abilities?.join(", ")}
                  </div>
                </div>

                <div className="stats-container">
                  <h4>Base Stats</h4>
                  {pokemonData.stats &&
                    Object.entries(pokemonData.stats).map(([stat, value]) => (
                      <div key={stat} className="stat-row">
                        <div className="stat-name">{stat}</div>
                        <div className="stat-bar-container">
                          <div
                            className="stat-bar"
                            style={{
                              width: `${Math.min(100, (value / 255) * 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="stat-value">{value}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Type Search Card */}
        <div className="card">
          <h2 className="card-title">Search by Type</h2>
          <div className="card-content">
            <div className="search-form">
              <input
                type="text"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Enter Pokemon type (e.g., fire)"
                className="input-field"
              />
              <button
                onClick={searchType}
                disabled={loading.type || !typeName.trim()}
                className="search-button"
              >
                {loading.type ? "Loading..." : "Search"}
              </button>
            </div>

            {error.type && <div className="error-message">{error.type}</div>}

            {typeData && (
              <div className="type-result">
                <h3
                  className={`type-header type-bg-${typeData.type.toLowerCase()}`}
                >
                  {typeData.type.toUpperCase()} Pokemon ({typeData.count})
                </h3>

                <ul className="pokemon-list">
                  {typeData.pokemon?.map((p, index) => (
                    <li key={index} className="pokemon-list-item">
                      <span className="pokemon-list-name">{p.name}</span>
                      <span className="pokemon-list-id">#{p.id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Pokemon Comparison Card */}
        <div className="card comparison-card">
          <h2 className="card-title">Compare Pokemon</h2>
          <div className="card-content">
            <div className="compare-form">
              <div className="compare-inputs">
                <input
                  type="text"
                  value={pokemon1}
                  onChange={(e) => setPokemon1(e.target.value)}
                  placeholder="First Pokemon"
                  className="input-field"
                />
                <span className="compare-vs">VS</span>
                <input
                  type="text"
                  value={pokemon2}
                  onChange={(e) => setPokemon2(e.target.value)}
                  placeholder="Second Pokemon"
                  className="input-field"
                />
              </div>
              <button
                onClick={comparePokemon}
                disabled={
                  loading.compare || !pokemon1.trim() || !pokemon2.trim()
                }
                className="search-button compare-button"
              >
                {loading.compare ? "Loading..." : "Compare"}
              </button>
            </div>

            {error.compare && (
              <div className="error-message">{error.compare}</div>
            )}

            {compareData && (
              <div className="compare-result">
                <div className="compare-header">
                  <div className="compare-pokemon">
                    <h3>{compareData.pokemon[0].name.toUpperCase()}</h3>
                    <div className="pokemon-id">
                      #{compareData.pokemon[0].id}
                    </div>
                    <div className="pokemon-types">
                      {compareData.pokemon[0].types.map((type, index) => (
                        <span
                          key={index}
                          className={`type-badge type-${type.toLowerCase()}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="compare-pokemon">
                    <h3>{compareData.pokemon[1].name.toUpperCase()}</h3>
                    <div className="pokemon-id">
                      #{compareData.pokemon[1].id}
                    </div>
                    <div className="pokemon-types">
                      {compareData.pokemon[1].types.map((type, index) => (
                        <span
                          key={index}
                          className={`type-badge type-${type.toLowerCase()}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="compare-stats">
                  <h4>Stats Comparison</h4>
                  {compareData.pokemon[0].stats &&
                    Object.entries(compareData.pokemon[0].stats).map(
                      ([stat, value]) => (
                        <div key={stat} className="compare-stat-row">
                          <div className="compare-stat-name">{stat}</div>
                          <div className="compare-stat-bars">
                            <div className="compare-stat-bar-container left">
                              <div
                                className="compare-stat-bar compare-left"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (value / 255) * 100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <div className="compare-stat-values">
                              <span>{value}</span>
                              <span>{compareData.pokemon[1].stats[stat]}</span>
                            </div>
                            <div className="compare-stat-bar-container right">
                              <div
                                className="compare-stat-bar compare-right"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (compareData.pokemon[1].stats[stat] / 255) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
