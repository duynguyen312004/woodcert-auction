package com.woodcert.auction.feature.identity.service.seed;

import com.woodcert.auction.feature.identity.repository.DistrictRepository;
import com.woodcert.auction.feature.identity.repository.ProvinceRepository;
import com.woodcert.auction.feature.identity.repository.WardRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocationSeedServiceImplTest {

    @Mock
    private ProvinceRepository provinceRepository;

    @Mock
    private DistrictRepository districtRepository;

    @Mock
    private WardRepository wardRepository;

    @Mock
    private LocationSeedClient locationSeedClient;

    @Mock
    private BundledLocationSeedLoader bundledLocationSeedLoader;

    @Mock
    private LocationSeedProperties properties;

    @InjectMocks
    private LocationSeedServiceImpl locationSeedService;

    @Test
    @DisplayName("seedIfEmpty skips when location seed is disabled")
    void seedIfEmpty_disabled_skips() {
        when(properties.enabled()).thenReturn(false);

        locationSeedService.seedIfEmpty();

        verify(provinceRepository, never()).count();
        verify(locationSeedClient, never()).fetchLocations();
    }

    @Test
    @DisplayName("seedIfEmpty skips when provinces already exist")
    void seedIfEmpty_provincesExist_skips() {
        when(properties.enabled()).thenReturn(true);
        when(provinceRepository.count()).thenReturn(1L);

        locationSeedService.seedIfEmpty();

        verify(locationSeedClient, never()).fetchLocations();
        verify(provinceRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("seedIfEmpty falls back to bundled seed when remote API fails")
    void seedIfEmpty_remoteFails_usesBundledSeed() {
        when(properties.enabled()).thenReturn(true);
        when(provinceRepository.count()).thenReturn(0L);
        when(districtRepository.count()).thenReturn(0L);
        when(wardRepository.count()).thenReturn(0L);
        when(locationSeedClient.fetchLocations()).thenThrow(new IllegalStateException("network error"));
        when(bundledLocationSeedLoader.loadLocations()).thenReturn(List.of(
                new LocationSeedClient.LocationSeedProvince(
                        "01",
                        "Ha Noi",
                        List.of()
                )
        ));

        locationSeedService.seedIfEmpty();

        verify(bundledLocationSeedLoader).loadLocations();
        verify(provinceRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("seedIfEmpty throws when location tables are inconsistent")
    void seedIfEmpty_inconsistentTables_throws() {
        when(properties.enabled()).thenReturn(true);
        when(provinceRepository.count()).thenReturn(0L);
        when(districtRepository.count()).thenReturn(1L);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> locationSeedService.seedIfEmpty()
        );

        assertEquals(
                "Location tables are inconsistent: provinces is empty but districts or wards already contain data",
                exception.getMessage()
        );
    }

    @Test
    @DisplayName("seedIfEmpty fetches and saves provinces districts wards in order")
    void seedIfEmpty_emptyTables_savesFetchedData() {
        when(properties.enabled()).thenReturn(true);
        when(provinceRepository.count()).thenReturn(0L);
        when(districtRepository.count()).thenReturn(0L);
        when(wardRepository.count()).thenReturn(0L);
        when(locationSeedClient.fetchLocations()).thenReturn(List.of(
                new LocationSeedClient.LocationSeedProvince(
                        "01",
                        "Ha Noi",
                        List.of(new LocationSeedClient.LocationSeedDistrict(
                                "001",
                                "01",
                                "Ba Dinh",
                                List.of(new LocationSeedClient.LocationSeedWard(
                                        "00001",
                                        "001",
                                        "Phuc Xa"
                                ))
                        ))
                )
        ));

        locationSeedService.seedIfEmpty();

        ArgumentCaptor<List> provinceCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<List> districtCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<List> wardCaptor = ArgumentCaptor.forClass(List.class);

        verify(provinceRepository).saveAll(provinceCaptor.capture());
        verify(districtRepository).saveAll(districtCaptor.capture());
        verify(wardRepository).saveAll(wardCaptor.capture());

        assertEquals(1, provinceCaptor.getValue().size());
        assertEquals(1, districtCaptor.getValue().size());
        assertEquals(1, wardCaptor.getValue().size());
    }
}
