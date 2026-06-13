package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.identity.dto.request.CreateAddressReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateAddressReq;
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
import static org.mockito.Mockito.never;
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

    @Test
    @DisplayName("createAddress makes the first address default")
    void createAddress_firstAddress_becomesDefault() {
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
        when(districtRepository.existsByCodeAndProvinceCode("001", "01")).thenReturn(true);
        when(wardRepository.existsByCodeAndDistrictCode("00001", "001")).thenReturn(true);
        when(addressRepository.existsByUser_Id("user-1")).thenReturn(false);
        stubLocationNames();
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address address = invocation.getArgument(0);
            address.setId(1L);
            return address;
        });

        AddressRes result = addressService.createAddress("user-1", request);

        assertEquals(true, result.isDefault());
        verify(addressRepository).clearDefaultByUserId("user-1");
    }

    @Test
    @DisplayName("updateAddress keeps default state while updating owned address fields")
    void updateAddress_ownedAddress_updatesFields() {
        Address address = address("user-1", 7L, true);
        UpdateAddressReq request = new UpdateAddressReq(
                "New Receiver",
                "0988777666",
                "New Street 20",
                "01",
                "001",
                "00001"
        );

        when(addressRepository.findByIdAndUser_Id(7L, "user-1")).thenReturn(Optional.of(address));
        when(provinceRepository.existsById("01")).thenReturn(true);
        when(districtRepository.existsByCodeAndProvinceCode("001", "01")).thenReturn(true);
        when(wardRepository.existsByCodeAndDistrictCode("00001", "001")).thenReturn(true);
        when(addressRepository.save(address)).thenReturn(address);
        stubLocationNames();

        AddressRes result = addressService.updateAddress("user-1", 7L, request);

        assertEquals("New Receiver", result.receiverName());
        assertEquals("0988777666", result.phoneNumber());
        assertEquals(true, result.isDefault());
        verify(addressRepository, never()).clearDefaultByUserId("user-1");
    }

    @Test
    @DisplayName("updateAddress rejects an address owned by another user")
    void updateAddress_notOwned_throwsNotFound() {
        when(addressRepository.findByIdAndUser_Id(7L, "user-1")).thenReturn(Optional.empty());

        UpdateAddressReq request = new UpdateAddressReq(
                "New Receiver",
                "0988777666",
                "New Street 20",
                "01",
                "001",
                "00001"
        );

        AppException exception = assertThrows(
                AppException.class,
                () -> addressService.updateAddress("user-1", 7L, request)
        );

        assertEquals("Address not found", exception.getMessage());
    }

    @Test
    @DisplayName("setDefaultAddress clears the old default and activates the selected address")
    void setDefaultAddress_nonDefaultAddress_switchesDefault() {
        Address address = address("user-1", 7L, false);
        when(addressRepository.findByIdAndUser_Id(7L, "user-1")).thenReturn(Optional.of(address));
        when(addressRepository.save(address)).thenReturn(address);
        stubLocationNames();

        AddressRes result = addressService.setDefaultAddress("user-1", 7L);

        assertEquals(true, result.isDefault());
        verify(addressRepository).clearDefaultByUserId("user-1");
        verify(addressRepository).save(address);
    }

    @Test
    @DisplayName("deleteAddress promotes the oldest remaining address when deleting the default")
    void deleteAddress_defaultAddress_promotesOldestRemaining() {
        Address currentDefault = address("user-1", 7L, true);
        Address replacement = address("user-1", 9L, false);
        when(addressRepository.findByIdAndUser_Id(7L, "user-1"))
                .thenReturn(Optional.of(currentDefault));
        when(addressRepository.findFirstByUser_IdAndIdNotOrderByIdAsc("user-1", 7L))
                .thenReturn(Optional.of(replacement));

        addressService.deleteAddress("user-1", 7L);

        assertEquals(true, replacement.isDefault());
        verify(addressRepository).delete(currentDefault);
        verify(addressRepository).save(replacement);
    }

    @Test
    @DisplayName("deleteAddress does not promote another address when deleting a non-default")
    void deleteAddress_nonDefaultAddress_onlyDeletes() {
        Address address = address("user-1", 7L, false);
        when(addressRepository.findByIdAndUser_Id(7L, "user-1")).thenReturn(Optional.of(address));

        addressService.deleteAddress("user-1", 7L);

        verify(addressRepository).delete(address);
        verify(addressRepository, never())
                .findFirstByUser_IdAndIdNotOrderByIdAsc("user-1", 7L);
    }

    private Address address(String userId, Long id, boolean isDefault) {
        User user = new User();
        user.setId(userId);
        Address address = new Address();
        address.setId(id);
        address.setUser(user);
        address.setReceiverName("Receiver");
        address.setPhoneNumber("0911222333");
        address.setStreetAddress("Street 1");
        address.setProvinceCode("01");
        address.setDistrictCode("001");
        address.setWardCode("00001");
        address.setDefault(isDefault);
        return address;
    }

    private void stubLocationNames() {
        Province province = new Province();
        province.setCode("01");
        province.setName("Hà Nội");
        District district = new District();
        district.setCode("001");
        district.setName("Ba Đình");
        Ward ward = new Ward();
        ward.setCode("00001");
        ward.setName("Phúc Xá");
        when(provinceRepository.findById("01")).thenReturn(Optional.of(province));
        when(districtRepository.findById("001")).thenReturn(Optional.of(district));
        when(wardRepository.findById("00001")).thenReturn(Optional.of(ward));
    }
}
