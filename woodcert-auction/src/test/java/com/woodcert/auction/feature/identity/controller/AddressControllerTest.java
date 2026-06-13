package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.feature.identity.dto.request.CreateAddressReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateAddressReq;
import com.woodcert.auction.feature.identity.dto.response.AddressRes;
import com.woodcert.auction.feature.identity.service.AddressService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressControllerTest {

    @Mock
    private AddressService addressService;

    @InjectMocks
    private AddressController controller;

    @Test
    void getAddresses_returnsCurrentUsersAddresses() {
        AddressRes address = address(true);
        when(addressService.getCurrentUserAddresses("user-1")).thenReturn(List.of(address));

        var response = controller.getAddresses("user-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data()).containsExactly(address);
    }

    @Test
    void createAddress_returnsCreated() {
        CreateAddressReq request = new CreateAddressReq(
                "Receiver", "0911222333", "Street 1", "01", "001", "00001", false);
        when(addressService.createAddress("user-1", request)).thenReturn(address(true));

        var response = controller.createAddress("user-1", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data().isDefault()).isTrue();
    }

    @Test
    void updateAddress_returnsUpdatedAddress() {
        UpdateAddressReq request = new UpdateAddressReq(
                "New Receiver", "0988777666", "New Street 20", "01", "001", "00001");
        when(addressService.updateAddress("user-1", 1L, request)).thenReturn(address(true));

        var response = controller.updateAddress("user-1", 1L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(addressService).updateAddress("user-1", 1L, request);
    }

    @Test
    void setDefaultAddress_returnsUpdatedAddress() {
        when(addressService.setDefaultAddress("user-1", 1L)).thenReturn(address(true));

        var response = controller.setDefaultAddress("user-1", 1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data().isDefault()).isTrue();
    }

    @Test
    void deleteAddress_returnsOk() {
        var response = controller.deleteAddress("user-1", 1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(addressService).deleteAddress("user-1", 1L);
    }

    private AddressRes address(boolean isDefault) {
        return new AddressRes(
                1L,
                "Receiver",
                "0911222333",
                "Street 1",
                "01",
                "001",
                "00001",
                isDefault,
                "Hà Nội",
                "Ba Đình",
                "Phúc Xá");
    }
}
