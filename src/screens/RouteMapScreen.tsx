import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Linking } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigatorSimple';
import { openDirections, openRouteInMaps, isBeyondBikeCap, MAX_BIKE_MIN } from '../utils/directions';
import { fetchRoute, RouteResult, decodePolyline6 } from '../services/routingService';
import { estimateMinutes } from '../utils/effort';
import { shareTrailGpx } from '../utils/shareGpx';
import { networkLabel, difficultyLabel } from '../utils/trailMeta';
import ElevationProfile from '../components/ElevationProfile';

type RouteMapRouteProp = RouteProp<RootStackParamList, 'RouteMap'>;

export default function RouteMapScreen() {
  const route = useRoute<RouteMapRouteProp>();
  const { origin, dest, destUrl, pointOnly, mode: initialMode, trail: paramTrail, otherTrails } = route.params;
  const mapRef = useRef<MapView>(null);

  // Parcours actif (cliquer un autre parcours en trait fin le rend actif). `trail` = l'actif :
  // tout le reste du composant s'appuie dessus.
  const [activeTrail, setActiveTrail] = useState(paramTrail);
  const trail = activeTrail;

  // Durée corrigée par le dénivelé (Naismith/Tobler) : vaut la durée à plat tant que le D+ (ascent)
  // n'est pas généré, puis s'ajuste automatiquement quand l'enrichissement SRTM l'aura renseigné.
  const trailMinutes = trail ? estimateMinutes(trail.mode, trail.km, trail.ascent) : 0;
  const [exporting, setExporting] = useState(false);

  // Mode « rando/vélo » : géométrie EMBARQUÉE du tracé (zéro API), décodée une fois.
  const trailCoords = useMemo(() => (trail ? decodePolyline6(trail.geom) : null), [trail]);

  // Autres parcours (même mode) accessibles depuis la gare, en traits fins cliquables.
  // Ensemble = parcours initial + otherTrails, MOINS l'actif. Décodés une fois.
  const thinTrails = useMemo(() => {
    if (!paramTrail) return [];
    const all = [paramTrail, ...(otherTrails ?? [])];
    return all
      .filter(t => t !== activeTrail)
      .map(t => ({ t, coords: decodePolyline6(t.geom) }));
  }, [paramTrail, otherTrails, activeTrail]);
  const thinColor = (m: 'walk' | 'bike') =>
    m === 'bike' ? 'rgba(0,131,143,0.7)' : 'rgba(67,160,71,0.7)';

  // Mode sélectionnable dans cette fenêtre (à pied / à vélo) — recalcule le tracé Valhalla.
  // En mode trail, le mode est fixé par le tracé lui-même.
  const [mode, setMode] = useState<'walk' | 'bike'>(trail?.mode ?? initialMode ?? 'walk');

  // Android : marqueurs custom capturés seulement si tracksViewChanges au montage.
  const [trackMarkers, setTrackMarkers] = useState(Platform.OS === 'android');
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setTrackMarkers(true);
    const t = setTimeout(() => setTrackMarkers(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const originCoord = { latitude: origin.lat, longitude: origin.lon };
  const destCoord = { latitude: dest.lat, longitude: dest.lon };

  // Vrai tracé piéton/vélo récupéré au runtime (Valhalla). null = pas encore / échec → ligne droite.
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(!trail);
  useEffect(() => {
    if (trail) return; // tracé déjà embarqué → pas d'appel réseau
    let cancelled = false;
    setRouteLoading(true);
    fetchRoute({ lat: origin.lat, lon: origin.lon }, { lat: dest.lat, lon: dest.lon }, mode)
      .then((r) => {
        if (cancelled) return;
        setRouteData(r);
        setRouteLoading(false);
        if (r) {
          mapRef.current?.fitToCoordinates(r.coords, {
            edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
            animated: true,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [origin.lat, origin.lon, dest.lat, dest.lon, mode]);

  // Point du TRACÉ le plus proche de la gare = là où on rejoint la balade (pas le 1er sommet arbitraire).
  const joinPoint = useMemo(() => {
    if (!trailCoords || trailCoords.length === 0) return null;
    let best = trailCoords[0], bestD = Infinity;
    for (const c of trailCoords) {
      const d = (c.latitude - origin.lat) ** 2 + (c.longitude - origin.lon) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }, [trailCoords, origin.lat, origin.lon]);

  // Mode trail : VRAI chemin d'accès gare → point de jonction (Valhalla). Repli = ligne droite.
  const [accessRoute, setAccessRoute] = useState<RouteResult | null>(null);
  useEffect(() => {
    if (!trail || !joinPoint) return;
    let cancelled = false;
    setAccessRoute(null);
    fetchRoute({ lat: origin.lat, lon: origin.lon }, { lat: joinPoint.latitude, lon: joinPoint.longitude }, trail.mode)
      .then((r) => {
        if (cancelled || !r) return;
        setAccessRoute(r);
        mapRef.current?.fitToCoordinates([...r.coords, ...(trailCoords ?? [])], {
          edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
          animated: true,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [trail, joinPoint, origin.lat, origin.lon]);

  // Coords du chemin d'accès affiché (vrai tracé si dispo, sinon ligne droite gare → jonction).
  const accessCoords = accessRoute?.coords ?? (joinPoint ? [originCoord, joinPoint] : null);

  // Cadre garanti : en mode trail, on cadre l'accès + le tour actif + TOUS les autres parcours
  // (sinon un sentier — surtout long ou secondaire — peut rester hors champ). Sinon : tracé Valhalla
  // ou gare + POI. `animated` optionnel.
  const fitAll = (animated = false) => {
    const coords = trailCoords
      ? [
          ...(accessCoords ?? [originCoord]),
          ...trailCoords,
          ...thinTrails.flatMap(x => x.coords),
        ]
      : routeData?.coords ?? [originCoord, destCoord];
    if (coords.length < 2) return;
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
      animated,
    });
  };

  // Recadre dès que le tracé actif change (ouverture initiale ET après avoir touché un autre
  // parcours) — corrige les cas où le sentier restait hors de la vue. Léger délai = fiabilité
  // de fitToCoordinates après la mise en page (iOS + Android).
  useEffect(() => {
    if (!trailCoords) return;
    const id = setTimeout(() => fitAll(true), 80);
    return () => clearTimeout(id);
  }, [trailCoords]);

  const initialRegion = {
    latitude: (origin.lat + dest.lat) / 2,
    longitude: (origin.lon + dest.lon) / 2,
    latitudeDelta: Math.max(Math.abs(origin.lat - dest.lat) * 2.2, 0.05),
    longitudeDelta: Math.max(Math.abs(origin.lon - dest.lon) * 2.2, 0.05),
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => fitAll()}
        onLayout={() => fitAll()}
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
      >
        {trailCoords ? (
          <>
            {/* Autres parcours du même mode : traits fins cliquables (couleur du mode atténuée) */}
            {thinTrails.map(({ t, coords }, i) => (
              <Polyline
                key={`thin-${i}`}
                coordinates={coords}
                strokeColor={thinColor(t.mode)}
                strokeWidth={3}
                tappable
                onPress={() => setActiveTrail(t)}
              />
            ))}
            {/* Accès gare → départ de la balade : pointillé TRÈS FIN (le « comment s'y rendre ») */}
            {accessCoords && (
              <Polyline
                coordinates={accessCoords}
                strokeColor="#1565C0"
                strokeWidth={2}
                lineDashPattern={[1, 6]}
              />
            )}
            {/* Le tour à faire (VERT plein) — géométrie embarquée */}
            <Polyline coordinates={trailCoords} strokeColor="#4CAF50" strokeWidth={5} />
          </>
        ) : routeData ? (
          // Trajet vers l'activité (« comment s'y rendre ») : pointillé TRÈS FIN, cohérent partout.
          <Polyline coordinates={routeData.coords} strokeColor="#1565C0" strokeWidth={2} lineDashPattern={[1, 6]} />
        ) : (
          // Repli (chargement ou échec réseau) : ligne droite, même style pointillé fin.
          <Polyline
            coordinates={[originCoord, destCoord]}
            strokeColor="#1565C0"
            strokeWidth={2}
            lineDashPattern={[1, 6]}
          />
        )}
        <Marker
          coordinate={originCoord}
          title={origin.name}
          description="Gare"
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={Platform.OS === 'android' ? trackMarkers : false}
        >
          <View style={styles.originDot} />
        </Marker>
        {trailCoords ? (
          <>
            {/* Point où l'on rejoint la balade depuis la gare */}
            <Marker
              coordinate={joinPoint ?? trailCoords[0]}
              title={trail!.name}
              description={trail!.loop ? 'Début / fin de la boucle' : 'Départ'}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={Platform.OS === 'android' ? trackMarkers : false}
            >
              <View style={styles.destDot} />
            </Marker>
            {/* Fin de la rando si linéaire (gare → gare) */}
            {!trail!.loop && (
              <Marker
                coordinate={trailCoords[trailCoords.length - 1]}
                title="Arrivée"
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={Platform.OS === 'android' ? trackMarkers : false}
              >
                <View style={styles.destDot} />
              </Marker>
            )}
          </>
        ) : (
          <Marker
            coordinate={destCoord}
            title={dest.name}
            description={destUrl ? 'Toucher pour voir le site ↗' : 'Activité'}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={Platform.OS === 'android' ? trackMarkers : false}
            onPress={destUrl ? () => Linking.openURL(destUrl).catch(() => {}) : undefined}
          >
            <View style={styles.destDot} />
          </Marker>
        )}
      </MapView>

      {/* Haut : infos rando (mode trail) ou les 2 points de recherche */}
      {trail ? (
        <View style={styles.topCard} pointerEvents="none">
          <Text style={styles.trailTitle} numberOfLines={2}>
            {trail.mode === 'bike' ? '🚴' : '🥾'} {trail.name}
          </Text>
          {(trail.generated || trail.ref || networkLabel(trail.network) || difficultyLabel(trail.difficulty)) ? (
            <Text style={styles.trailMeta}>
              {[trail.generated ? 'Boucle suggérée' : trail.ref, networkLabel(trail.network), difficultyLabel(trail.difficulty)].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          <Text style={styles.trailMeta}>
            {trail.loop ? 'Boucle' : 'Linéaire'} · {trail.km.toFixed(1).replace('.', ',')} km · ~{trailMinutes} min{trail.ascent != null ? ` · ↗ ${trail.ascent} m` : ''}{trail.descent != null ? ` ↘ ${trail.descent} m` : ''}
          </Text>
          {trail.profile && trail.profile.length > 1 ? (
            <ElevationProfile profile={trail.profile} color={trail.mode === 'bike' ? '#00838F' : '#43A047'} />
          ) : null}
          <Text style={styles.trailMeta}>
            Accès depuis {origin.name} · ~{trail.accessKm.toFixed(1).replace('.', ',')} km
          </Text>
          {/* Légende des couleurs */}
          <View style={styles.legendRow}>
            <View style={[styles.legendDash, { backgroundColor: '#1565C0' }]} />
            <Text style={styles.legendText}>Accès depuis la gare</Text>
            <View style={[styles.legendLine, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>{trail.mode === 'bike' ? 'Le parcours' : 'La balade'}</Text>
          </View>
          {thinTrails.length > 0 && (
            <Text style={styles.trailMeta}>
              {thinTrails.length} autre{thinTrails.length > 1 ? 's' : ''} parcours à proximité — touchez un trait fin
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.topCard} pointerEvents="none">
          <View style={styles.pointRow}>
            <View style={styles.originDot} />
            <Text style={styles.pointText} numberOfLines={1}>{origin.name}</Text>
          </View>
          <View style={styles.pointConnector} />
          <View style={styles.pointRow}>
            <View style={styles.destDot} />
            <Text style={styles.pointText} numberOfLines={1}>{dest.name}</Text>
          </View>
          {pointOnly && (
            <Text style={styles.trailMeta}>
              ⚠️ Tracé du sentier non disponible — seul l'emplacement est connu (itinéraire pour s'y rendre affiché).
            </Text>
          )}
        </View>
      )}

      {/* Recentrer */}
      <TouchableOpacity style={styles.recenter} onPress={() => fitAll(true)} activeOpacity={0.85}>
        <Ionicons name="scan-outline" size={22} color="#0C3823" />
      </TouchableOpacity>

      {/* Bas : sélecteur de mode + temps + lancer la navigation */}
      <View style={styles.footer}>
        {trail ? (
          /* Mode rando/vélo : infos du tracé (le mode est fixé par la rando) */
          <View style={styles.timeRow}>
            <Text style={styles.timeBig}>~{trailMinutes} min</Text>
            <Text style={styles.footerHint}>
              {trail.mode === 'bike' ? 'à vélo' : 'à pied'} · {trail.km.toFixed(1).replace('.', ',')} km
              {' · '}{trail.loop ? 'boucle' : 'gare → gare'}
            </Text>
          </View>
        ) : (
          <>
            {/* Sélecteur à pied / à vélo (recalcule le tracé) */}
            <View style={styles.modeRow}>
              {(['walk', 'bike'] as const).map((m) => {
                const active = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                    activeOpacity={0.85}
                    onPress={() => setMode(m)}
                  >
                    <Text style={[styles.modeText, active && styles.modeTextActive]}>
                      {m === 'bike' ? '🚲 À vélo' : '🚶 À pied'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Temps + distance */}
            <View style={styles.timeRow}>
              {routeLoading ? (
                <>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.footerHint}>Calcul de l'itinéraire…</Text>
                </>
              ) : routeData ? (
                <>
                  <Text style={styles.timeBig}>{routeData.minutes || '—'} min</Text>
                  <Text style={styles.footerHint}>
                    {mode === 'bike' ? 'à vélo' : 'à pied'} · {routeData.km.toFixed(1).replace('.', ',')} km
                    {mode === 'bike' && isBeyondBikeCap(routeData.minutes)
                      ? `  ·  ⚠️ au-delà de ${MAX_BIKE_MIN} min`
                      : ''}
                  </Text>
                </>
              ) : (
                <Text style={styles.footerHint}>
                  Itinéraire indisponible — trajet à vol d'oiseau affiché
                </Text>
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() =>
            trail && joinPoint
              ? openDirections(
                  { lat: origin.lat, lon: origin.lon },
                  { name: trail.name, lat: joinPoint.latitude, lon: joinPoint.longitude, mode: trail.mode }
                )
              : openDirections(
                  { lat: origin.lat, lon: origin.lon },
                  { name: dest.name, lat: dest.lat, lon: dest.lon, mode }
                )
          }
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.btnText}>
            {trail ? 'Aller au départ' : 'Lancer la navigation'}
          </Text>
        </TouchableOpacity>

        {/* Mode trail : Exporter le .gpx (enregistrer/partager) + Ouvrir le .gpx (choisir l'app :
            OsmAnd/Komoot/Fichiers…). Les deux passent par la feuille native (vrai tracé du sentier). */}
        {trail && (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btnSecondary, styles.btnRowItem]}
              activeOpacity={0.85}
              disabled={exporting}
              onPress={async () => {
                setExporting(true);
                try { await shareTrailGpx(trail); } catch {} finally { setExporting(false); }
              }}
            >
              <Ionicons name="download-outline" size={16} color="#0C3823" />
              <Text style={styles.btnSecondaryText} numberOfLines={1}>{exporting ? '…' : 'Exporter GPX'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecondary, styles.btnRowItem]}
              activeOpacity={0.85}
              onPress={() => trailCoords && openRouteInMaps(trailCoords, trail.mode)}
            >
              <Ionicons name="map-outline" size={16} color="#0C3823" />
              <Text style={styles.btnSecondaryText} numberOfLines={1}>Ouvrir dans Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  map: { flex: 1 },
  originDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#2196F3', borderWidth: 3, borderColor: '#FFFFFF',
  },
  destDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#F44336', borderWidth: 3, borderColor: '#FFFFFF',
  },
  topCard: {
    position: 'absolute',
    top: 16, left: 16, right: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3,
    elevation: 4,
    gap: 2,
  },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointConnector: {
    width: 2, height: 12, marginLeft: 7,
    backgroundColor: '#B0BEC5',
  },
  pointText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0C3823' },
  trailTitle: { fontSize: 15, fontWeight: '800', color: '#0C3823' },
  trailMeta: { fontSize: 12, color: '#5F6368', marginTop: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  legendDash: { width: 14, height: 2, borderRadius: 1, opacity: 0.9 },
  legendLine: { width: 14, height: 4, borderRadius: 2, marginLeft: 8 },
  legendText: { fontSize: 11, color: '#5F6368', fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#EEF1F4', borderWidth: 1, borderColor: 'transparent',
  },
  modeBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  modeText: { fontSize: 14, fontWeight: '600', color: '#5F6368' },
  modeTextActive: { color: '#0C3823', fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minHeight: 22 },
  timeBig: { fontSize: 20, fontWeight: '800', color: '#0C3823' },
  recenter: {
    position: 'absolute',
    top: 16, right: 16,
    backgroundColor: '#FFFFFF',
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3,
    elevation: 5,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  footerText: { fontSize: 14, fontWeight: '700', color: '#0C3823' },
  footerHint: { fontSize: 12, color: '#5F6368' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#4CAF50', paddingVertical: 13, borderRadius: 12, marginTop: 2,
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#4CAF50',
    paddingVertical: 11, borderRadius: 12, marginTop: 8,
  },
  btnSecondaryText: { color: '#0C3823', fontSize: 14, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnRowItem: { flex: 1, marginTop: 0 },
});
