package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SellerReputationServiceImplTest {

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @InjectMocks
    private SellerReputationServiceImpl sellerReputationService;

    @Test
    @DisplayName("updates reputation score when seller profile exists")
    void updateReputationScore_existingProfile_savesScore() {
        SellerProfile sellerProfile = new SellerProfile();
        sellerProfile.setUserId("seller-1");
        sellerProfile.setReputationScore(new BigDecimal("5.00"));
        when(sellerProfileRepository.findById("seller-1")).thenReturn(Optional.of(sellerProfile));

        sellerReputationService.updateReputationScore("seller-1", new BigDecimal("4.5"));

        ArgumentCaptor<SellerProfile> captor = ArgumentCaptor.forClass(SellerProfile.class);
        verify(sellerProfileRepository).save(captor.capture());
        assertThat(captor.getValue().getReputationScore()).isEqualByComparingTo("4.5");
    }

    @Test
    @DisplayName("does not fail when seller profile is missing")
    void updateReputationScore_missingProfile_doesNotSave() {
        when(sellerProfileRepository.findById("seller-1")).thenReturn(Optional.empty());

        sellerReputationService.updateReputationScore("seller-1", new BigDecimal("4.5"));

        verify(sellerProfileRepository).findById("seller-1");
        verifyNoMoreInteractions(sellerProfileRepository);
    }
}
