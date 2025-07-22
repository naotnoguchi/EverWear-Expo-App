import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import i18n from '../lib/i18n';
import { Period } from "../services/statisticsServiceFactory";

export default function ImpactScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  // 統計コンテキストを使用（新しいAPI）
  const {
    impactData: impact,
    isCalculating,
    calculationError,
    period,
    setPeriod,
    recalculateStatistics
  } = useStatistics();

  // ローディングとエラーの状態
  const loading = isCalculating;
  const error = calculationError;

  // 環境影響データを共有
  const handleShare = async () => {
    try {
      const totalSavings = (impact?.electricitySaved.cost || 0) + (impact?.waterSaved.cost || 0) + (impact?.detergentSaved.cost || 0);
      
      const shareMessage = t('impact.share.message', {
        co2: impact?.co2Reduced.toFixed(1),
        trees: impact?.treeEquivalent.toFixed(1),
        water: impact?.waterSaved.amount,
        waterCost: impact?.waterSaved.cost,
        electricity: impact?.electricitySaved.amount,
        electricityCost: impact?.electricitySaved.cost,
        detergent: impact?.detergentSaved.amount,
        detergentCost: impact?.detergentSaved.cost,
        totalSavings: totalSavings
      });

      await Share.share({
        message: shareMessage,
        title: t('impact.share.title')
      });
    } catch (error) {
      console.error('共有エラー:', error);
    }
  };

  // モーダル表示状態
  const [showWashInfoModal, setShowWashInfoModal] = useState(false);
  const [showWaterInfoModal, setShowWaterInfoModal] = useState(false);
  const [showElectricityInfoModal, setShowElectricityInfoModal] = useState(false);
  const [showCO2InfoModal, setShowCO2InfoModal] = useState(false);
  const [showTreeInfoModal, setShowTreeInfoModal] = useState(false);
  const [showDetergentInfoModal, setShowDetergentInfoModal] = useState(false);
  const [showLifespanInfoModal, setShowLifespanInfoModal] = useState(false);

  // 期間変更の処理
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  // Period options
  const periodOptions: { label: string; value: Period }[] = [
    { label: t('impact.period.1month'), value: '1month' },
    { label: t('impact.period.3months'), value: '3months' },
    { label: t('impact.period.6months'), value: '6months' },
    { label: t('impact.period.1year'), value: '1year' },
    { label: t('impact.period.all'), value: 'all' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterSection: {
      marginBottom: 16,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    filterOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
    },
    filterOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterOptionText: {
      fontSize: 12,
    },
    filterOptionTextSelected: {
      color: "white",
      fontWeight: 'bold',
    },
    card: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    highlightContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    highlightItem: {
      flex: 1,
      alignItems: 'center',
    },
    highlightValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: "#27ae60",
      marginBottom: 4,
    },
    highlightLabel: {
      fontSize: 12,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    impactDescription: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    resourceItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    resourceIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    resourceInfo: {
      flex: 1,
    },
    resourceTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    resourceValue: {
      fontSize: 14,
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
    },
    totalSavings: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    totalSavingsLabel: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    totalSavingsValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: "#27ae60",
    },
    lifespanDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    lifespanEffect: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      padding: 12,
      borderRadius: 8,
    },
    lifespanIconContainer: {
      marginRight: 12,
    },
    lifespanValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    chartContainer: {
      height: 200,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      marginTop: 60,
      marginBottom: 16,
    },
    chartBarContainer: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    chartBarLabels: {
      alignItems: 'center',
      marginBottom: 4,
    },
    chartValue: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    chartCo2Value: {
      fontSize: 10,
    },
    chartBar: {
      width: 20,
      borderRadius: 10,
      marginBottom: 8,
    },
    chartLabel: {
      fontSize: 12,
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 4,
    },
    legendText: {
      fontSize: 12,
    },
    environmentalImpact: {
      marginBottom: 16,
    },
    treeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 12,
    },
    treeIcon: {
      marginHorizontal: 4,
    },
    environmentalText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    shareButton: {
      backgroundColor: "#27ae60",
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 8,
    },
    shareButtonText: {
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 8,
    },
    errorText: {
      textAlign: 'center',
      marginVertical: 16,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.text,
    },
    modalText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
      color: theme.text,
    },
    modalCloseButton: {
      alignSelf: 'flex-end',
      padding: 8,
    },
    infoIcon: {
      marginLeft: 8,
    },
  });

  // Render loading state
  if (loading && !impact) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>{t('impact.loading')}</Text>
      </View>
    );
  }

  // Render error state
  if (error && !impact) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{t('impact.error.title')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={recalculateStatistics}>
          <Text style={styles.retryButtonText}>{t('impact.error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: t('impact.title'),
          headerBackTitle: t('common.back'),
        }} 
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Period selector */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>{t('common.period')}</Text>
            <View style={styles.optionsRow}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    period === option.value && styles.filterOptionSelected,
                    { borderColor: theme.border }
                  ]}
                  onPress={() => handlePeriodChange(option.value)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: theme.text },
                      period === option.value && styles.filterOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Main impact card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="leaf" size={24} color="#27ae60" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t('impact.metrics.washReduction')}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowWashInfoModal(true)}
                style={styles.infoIcon}
              >
                <Ionicons name="information-circle-outline" size={20} color={theme.text + "99"} />
              </TouchableOpacity>
            </View>

            <View style={styles.highlightContainer}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>{(impact?.totalWashesReduced || 0).toFixed(1)}</Text>
                <Text style={[styles.highlightLabel, { color: theme.text }]}>{t('impact.metrics.washesReduced')}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>{(impact?.co2Reduced || 0).toFixed(1)} {t('impact.units.kg')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.highlightLabel, { color: theme.text }]}>{t('impact.metrics.co2Reduced')}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowCO2InfoModal(true)}
                    style={{ marginLeft: 2 }}
                  >
                    <Ionicons name="information-circle-outline" size={14} color={theme.text + "99"} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>{(impact?.treeEquivalent || 0).toFixed(1)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.highlightLabel, { color: theme.text }]}>{t('impact.metrics.treeEquivalent')}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowTreeInfoModal(true)}
                    style={{ marginLeft: 2 }}
                  >
                    <Ionicons name="information-circle-outline" size={14} color={theme.text + "99"} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={[styles.impactDescription, { color: theme.text + "CC" }]}>
              {t('impact.description', {
                washesReduced: (impact?.totalWashesReduced || 0).toFixed(1),
                treeEquivalent: (impact?.treeEquivalent || 0).toFixed(1)
              })}
            </Text>
          </View>

          {/* Resource savings card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="water" size={24} color="#3498db" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t('impact.metrics.resourceSavings')}
              </Text>
            </View>

            <View style={styles.resourceItem}>
              <View style={styles.resourceIconContainer}>
                <Ionicons name="flash" size={24} color="#f1c40f" />
              </View>
              <View style={styles.resourceInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.resourceTitle, { color: theme.text }]}>{t('impact.metrics.electricitySaved')}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowElectricityInfoModal(true)}
                    style={styles.infoIcon}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={theme.text + "99"} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.resourceValue, { color: theme.text }]}>
                  {impact?.electricitySaved.amount || 0} {t('impact.units.kwh')}（{i18n.language === 'ja' 
                    ? `${impact?.electricitySaved.cost || 0}${t('impact.units.yen')}${t('impact.units.equivalent')}`
                    : `${t('impact.units.yen')}${impact?.electricitySaved.cost || 0} ${t('impact.units.equivalent')}`
                  }）
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${Math.min(((impact?.electricitySaved.amount || 0) / 10) * 100, 100)}%`, 
                        backgroundColor: "#f1c40f" 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            <View style={styles.resourceItem}>
              <View style={styles.resourceIconContainer}>
                <Ionicons name="water" size={24} color="#3498db" />
              </View>
              <View style={styles.resourceInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.resourceTitle, { color: theme.text }]}>{t('impact.metrics.waterSaved')}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowWaterInfoModal(true)}
                    style={styles.infoIcon}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={theme.text + "99"} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.resourceValue, { color: theme.text }]}>
                  {impact?.waterSaved.amount || 0} {t('impact.units.liters')}（{i18n.language === 'ja' 
                    ? `${impact?.waterSaved.cost || 0}${t('impact.units.yen')}${t('impact.units.equivalent')}`
                    : `${t('impact.units.yen')}${impact?.waterSaved.cost || 0} ${t('impact.units.equivalent')}`
                  }）
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${Math.min(((impact?.waterSaved.amount || 0) / 1000) * 100, 100)}%`, 
                        backgroundColor: "#3498db" 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            <View style={styles.resourceItem}>
              <View style={styles.resourceIconContainer}>
                <Ionicons name="flask" size={24} color="#9b59b6" />
              </View>
              <View style={styles.resourceInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.resourceTitle, { color: theme.text }]}>{t('impact.metrics.detergentSaved')}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowDetergentInfoModal(true)}
                    style={styles.infoIcon}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={theme.text + "99"} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.resourceValue, { color: theme.text }]}>
                  {impact?.detergentSaved.amount || 0} {t('impact.units.ml')}（{i18n.language === 'ja' 
                    ? `${impact?.detergentSaved.cost || 0}${t('impact.units.yen')}${t('impact.units.equivalent')}`
                    : `${t('impact.units.yen')}${impact?.detergentSaved.cost || 0} ${t('impact.units.equivalent')}`
                  }）
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${Math.min(((impact?.detergentSaved.amount || 0) / 500) * 100, 100)}%`, 
                        backgroundColor: "#9b59b6" 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            <View style={styles.totalSavings}>
              <Text style={[styles.totalSavingsLabel, { color: theme.text }]}>
                {t('impact.metrics.totalSavings')}
              </Text>
              <Text style={styles.totalSavingsValue}>
                {i18n.language === 'ja' 
                  ? `${((impact?.electricitySaved.cost || 0) + (impact?.waterSaved.cost || 0) + (impact?.detergentSaved.cost || 0)).toLocaleString()}${t('impact.units.yen')}`
                  : `${t('impact.units.yen')}${((impact?.electricitySaved.cost || 0) + (impact?.waterSaved.cost || 0) + (impact?.detergentSaved.cost || 0)).toLocaleString()}`
                }
              </Text>
            </View>
          </View>

          {/* Clothing lifespan card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="shirt" size={24} color="#e74c3c" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t('impact.metrics.lifespanExtension')}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowLifespanInfoModal(true)}
                style={styles.infoIcon}
              >
                <Ionicons name="information-circle-outline" size={20} color={theme.text + "99"} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.lifespanDescription, { color: theme.text }]}>
              {t('impact.lifespanDescription', {
                washesReduced: (impact?.totalWashesReduced || 0).toFixed(1)
              })}
            </Text>

            <View style={styles.lifespanEffect}>
              <View style={styles.lifespanIconContainer}>
                <Ionicons name="time" size={32} color="#e74c3c" />
              </View>
              <Text style={[styles.lifespanValue, { color: theme.text }]}>
                {t('impact.lifespanValue', {
                  multiplier: Math.round((impact?.totalWashesReduced || 0) * 0.05) + 1
                })}
              </Text>
            </View>
          </View>

          {/* Monthly impact chart */}
          {impact && impact.monthlyImpact.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="bar-chart" size={24} color="#3498db" />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {t('impact.metrics.monthlyReduction')}
                </Text>
              </View>

              <View style={styles.chartContainer}>
                {impact.monthlyImpact.map((item, index) => {
                  // Calculate bar height based on maximum value
                  const maxCount = Math.max(
                    ...impact.monthlyImpact.map((i) => i.washesReduced),
                    1 // Avoid division by zero
                  );
                  const heightPercentage = (item.washesReduced / maxCount) * 100;

                  return (
                    <View key={item.month} style={styles.chartBarContainer}>
                      <View style={styles.chartBarLabels}>
                        <Text style={[styles.chartValue, { color: theme.text }]}>
                          {item.washesReduced.toFixed(1)}
                        </Text>
                        <Text style={[styles.chartCo2Value, { color: "#27ae60" }]}>
                          {item.co2Reduced.toFixed(1)}{t('impact.units.kg')}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${heightPercentage}%`,
                            backgroundColor: "#3498db",
                          },
                        ]}
                      />
                      <Text style={[styles.chartLabel, { color: theme.text }]}>
                        {item.month}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: "#3498db" }]} />
                  <Text style={[styles.legendText, { color: theme.text }]}>{t('impact.metrics.washesReduced')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: "#27ae60" }]} />
                  <Text style={[styles.legendText, { color: theme.text }]}>{t('impact.metrics.co2Reduced')}({t('impact.units.kg')})</Text>
                </View>
              </View>
            </View>
          )}

          {/* Environmental impact card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="globe" size={24} color="#27ae60" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t('impact.metrics.environmentalContribution')}
              </Text>
            </View>

            <View style={styles.environmentalImpact}>
              <View style={styles.treeContainer}>
                {Array.from({ length: Math.min(Math.ceil(impact?.treeEquivalent || 0), 5) }).map((_, index) => (
                  <Ionicons 
                    key={index} 
                    name="leaf" 
                    size={32} 
                    color="#27ae60" 
                    style={styles.treeIcon} 
                  />
                ))}
              </View>

              <Text style={[styles.environmentalText, { color: theme.text }]}>
                {t('impact.environmentalText', {
                  co2: (impact?.co2Reduced || 0).toFixed(1),
                  treeEquivalent: (impact?.treeEquivalent || 0).toFixed(1)
                })}
              </Text>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social" size={16} color="white" />
              <Text style={styles.shareButtonText}>{t('impact.share.button')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Wash Info Modal */}
      <Modal
        visible={showWashInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWashInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowWashInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('impact.info.washInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('impact.info.washInfo.content1')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.washInfo.content2')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.washInfo.content3')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Water Info Modal */}
      <Modal
        visible={showWaterInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWaterInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowWaterInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('impact.info.waterInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('impact.info.waterInfo.content1')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.waterInfo.content2')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.waterInfo.content3')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Electricity Info Modal */}
      <Modal
        visible={showElectricityInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowElectricityInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowElectricityInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('impact.info.energyInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('impact.info.energyInfo.content1')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.energyInfo.content2')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.energyInfo.content3')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* CO2 Info Modal */}
      <Modal
        visible={showCO2InfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCO2InfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCO2InfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('impact.info.co2Info.title')}</Text>

            <Text style={styles.modalText}>
              {t('impact.info.co2Info.content1')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.co2Info.content2')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.co2Info.content3')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Tree Info Modal */}
      <Modal
        visible={showTreeInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTreeInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTreeInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('impact.info.treeInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('impact.info.treeInfo.content1')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.treeInfo.content2')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.treeInfo.content3')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Detergent Info Modal */}
      <Modal
        visible={showDetergentInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetergentInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDetergentInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('impact.info.detergentInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('impact.info.detergentInfo.content1')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.detergentInfo.content2')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.detergentInfo.content3')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Lifespan Info Modal */}
      <Modal
        visible={showLifespanInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLifespanInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowLifespanInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('impact.info.lifespanInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('impact.info.lifespanInfo.content1')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.lifespanInfo.content2')}
            </Text>

            <Text style={styles.modalText}>
              {t('impact.info.lifespanInfo.content3')}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
