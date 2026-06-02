package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.identity.dto.request.CreateAddressReq;
import com.woodcert.auction.feature.identity.dto.response.AddressRes;
import com.woodcert.auction.feature.identity.entity.Address;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.Province;
import com.woodcert.auction.feature.identity.entity.District;
import com.woodcert.auction.feature.identity.entity.Ward;
import com.woodcert.auction.feature.identity.repository.AddressRepository;
import com.woodcert.auction.feature.identity.repository.DistrictRepository;
import com.woodcert.auction.feature.identity.repository.ProvinceRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.repository.WardRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressServiceImplTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProvinceRepository provinceRepository;

    @Mock
    private DistrictRepository districtRepository;

    @Mock
    private WardRepository wardRepository;

    @InjectMocks
    private AddressServiceImpl addressService;

    @Test
    @DisplayName("getCurrentUserAddresses returns mapped list for current user")
    void getCurrentUserAddresses_success_returnsMappedList() {
        Address address = new Address();
        address.setId(1L);
        address.setReceiverName("Receiver");
        address.setPhoneNumber("0911222333");
        address.setStreetAddress("Street 1");
        address.setProvinceCode("01");
        address.setDistrictCode("001");
        address.setWardCode("00001");
        address.setDefault(true);

        Province province = new Province();
        province.setCode("01");
        province.setName("Hà Nội");

        District district = new District();
        district.setCode("001");
        district.setName("Ba Đình");

        Ward ward = new Ward();
        ward.setCode("00001");
        ward.setName("Phúc Xá");

        when(addressRepository.findByUser_IdOrderByIsDefaultDescIdAsc("user-1")).thenReturn(List.of(address));
        when(provinceRepository.findById("01")).thenReturn(Optional.of(province));
        when(districtRepository.findById("001")).thenReturn(Optional.of(district));
        when(wardRepository.findById("00001")).thenReturn(Optional.of(ward));

        List<AddressRes> result = addressService.getCurrentUserAddresses("user-1");

        assertEquals(1, result.size());
        assertEquals("Receiver", result.get(0).receiverName());
        assertEquals("Hà Nội", result.get(0).provinceName());
        assertEquals("Ba Đình", result.get(0).districtName());
        assertEquals("Phúc Xá", result.get(0).wardName());
    }

    @Test
    @DisplayName("createAddress clears previous default address when new address is default")
    void createAddress_defaultAddress_clearsPreviousDefault() {
        User user = new User();
        user.setId("user-1");

        CreateAddressReq request = new CreateAddressReq(
                "Receiver",
                "0911222333",
                "Street 1",
                "1",
                "1",
                "1",
                true
        );

        Province province = new Province();
        province.setCode("01");
        province.setName("Hà Nội");

        District district = new District();
        district.setCode("001");
        district.setName("Ba Đình");

        Ward ward = new Ward();
        ward.setCode("00001");
        ward.setName("Phúc Xá");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(provinceRepository.existsById("01")).thenReturn(true);
        when(districtRepository.existsByCodeAndProvinceCode("001", "01")).thenReturn(true);
        when(wardRepository.existsByCodeAndDistrictCode("00001", "001")).thenReturn(true);

        when(provinceRepository.findById("01")).thenReturn(Optional.of(province));
        when(districtRepository.findById("001")).thenReturn(Optional.of(district));
        when(wardRepository.findById("00001")).thenReturn(Optional.of(ward));

        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address address = invocation.getArgument(0);
            address.setId(10L);
            return address;
        });

        AddressRes result = addressService.createAddress("user-1", request);

        assertEquals(10L, result.id());
        assertEquals("01", result.provinceCode());
        assertEquals("001", result.districtCode());
        assertEquals("00001", result.wardCode());
        assertEquals("Hà Nội", result.provinceName());
        assertEquals("Ba Đình", result.districtName());
        assertEquals("Phúc Xá", result.wardName());
        verify(addressRepository).clearDefaultByUserId("user-1");
    }

    @Test
    @DisplayName("createAddress throws when district does not belong to province")
    void createAddress_invalidDistrict_throwsAppException() {
        User user = new User();
        user.setId("user-1");
        CreateAddressReq request = new CreateAddressReq(
                "Receiver",
                "0911222333",
                "Street 1",
                "01",
                "001",
                "00001",
                false
        );

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(provinceRepository.existsById("01")).thenReturn(true);
        when(districtRepository.existsByCodeAndProvinceCode("001", "01")).thenReturn(false);

        AppException exception = assertThrows(
                AppException.class,
                () -> addressService.createAddress("user-1", request)
        );

        assertEquals("District does not belong to the provided province", exception.getMessage());
    }
}
