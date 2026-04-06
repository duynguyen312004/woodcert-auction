package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.identity.dto.response.ProvinceRes;
import com.woodcert.auction.feature.identity.dto.response.WardRes;
import com.woodcert.auction.feature.identity.entity.Province;
import com.woodcert.auction.feature.identity.entity.Ward;
import com.woodcert.auction.feature.identity.repository.DistrictRepository;
import com.woodcert.auction.feature.identity.repository.ProvinceRepository;
import com.woodcert.auction.feature.identity.repository.WardRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocationServiceImplTest {

    @Mock
    private ProvinceRepository provinceRepository;

    @Mock
    private DistrictRepository districtRepository;

    @Mock
    private WardRepository wardRepository;

    @InjectMocks
    private LocationServiceImpl locationService;

    @Test
    @DisplayName("getProvinces returns mapped province list")
    void getProvinces_success_returnsMappedList() {
        Province province = new Province();
        province.setCode("01");
        province.setName("Ha Noi");

        when(provinceRepository.findAllByOrderByNameAsc()).thenReturn(List.of(province));

        List<ProvinceRes> result = locationService.getProvinces();

        assertEquals(1, result.size());
        assertEquals("01", result.get(0).code());
    }

    @Test
    @DisplayName("getDistricts throws when province code does not exist")
    void getDistricts_provinceNotFound_throwsAppException() {
        when(provinceRepository.existsById("01")).thenReturn(false);

        AppException exception = assertThrows(
                AppException.class,
                () -> locationService.getDistricts("01")
        );

        assertEquals("Province not found", exception.getMessage());
    }

    @Test
    @DisplayName("getDistricts normalizes short province code before lookup")
    void getDistricts_shortProvinceCode_normalizesBeforeLookup() {
        when(provinceRepository.existsById("01")).thenReturn(true);
        when(districtRepository.findByProvinceCodeOrderByNameAsc("01")).thenReturn(List.of());

        locationService.getDistricts("1");

        org.mockito.Mockito.verify(provinceRepository).existsById("01");
        org.mockito.Mockito.verify(districtRepository).findByProvinceCodeOrderByNameAsc("01");
    }

    @Test
    @DisplayName("getWards returns mapped ward list for district")
    void getWards_success_returnsMappedList() {
        Ward ward = new Ward();
        ward.setCode("00001");
        ward.setDistrictCode("001");
        ward.setName("Ward 1");

        when(districtRepository.existsById("001")).thenReturn(true);
        when(wardRepository.findByDistrictCodeOrderByNameAsc("001")).thenReturn(List.of(ward));

        List<WardRes> result = locationService.getWards("001");

        assertEquals(1, result.size());
        assertEquals("Ward 1", result.get(0).name());
    }
}
