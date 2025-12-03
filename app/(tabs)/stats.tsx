import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, TrendingUp, Users, Award, ArrowUp, ArrowDown, MessageCircle, Heart, Share2, Eye, ThumbsUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line } from 'react-native-svg';
import { useState } from 'react';

const KEY_METRICS = [
  { label: 'Total Reach', value: '24.5K', change: '+12%', changeUp: true, icon: Users },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', changeUp: true, icon: TrendingUp },
  { label: 'Top Platform', value: 'IG', change: '21.6K', changeUp: true, icon: Award },
];

const WEEKLY_DATA = [
  { day: 'M', value: 65 },
  { day: 'T', value: 82 },
  { day: 'W', value: 91 },
  { day: 'T', value: 78 },
  { day: 'F', value: 85 },
  { day: 'S', value: 95 },
  { day: 'S', value: 88 },
];

const PLATFORM_STATS = [
  {
    name: 'Instagram',
    followers: '21.6K',
    growth: '+8%',
    growthUp: true,
    totalReach: '12.3K',
    icon: 'https://i.imgur.com/vkcuEzE.png',
    color: ['#E1306C', '#C13584']
  },
  {
    name: 'YouTube',
    followers: '3.7K',
    growth: '+2%',
    growthUp: true,
    totalReach: '2.1K',
    icon: 'https://i.imgur.com/8H35ptZ.png',
    color: ['#FF0000', '#DC143C']
  },
  {
    name: 'TikTok',
    followers: '18.3K',
    growth: '+5%',
    growthUp: true,
    totalReach: '9.8K',
    icon: 'https://i.imgur.com/K2FKVUP.png',
    color: ['#000000', '#333333']
  },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/(tabs)/home');
  };

  const handlePlatformPress = (platformName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedPlatform(expandedPlatform === platformName ? null : platformName);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonGradient}
            onPress={handleBack}
            activeOpacity={0.6}
          >
            <ArrowLeft color="#ffffff" size={18} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Your </Text>
          <Text style={styles.pageTitleBold}>Analytics</Text>
        </View>

        <View style={styles.metricsGrid}>
          {KEY_METRICS.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <View key={index} style={styles.metricCard}>
                <View style={styles.metricIconContainer}>
                  <IconComponent color="#60a5fa" size={20} strokeWidth={2} />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <View style={styles.metricChange}>
                  {metric.changeUp ? (
                    <ArrowUp color="#10b981" size={12} strokeWidth={2.5} />
                  ) : (
                    <ArrowDown color="#ef4444" size={12} strokeWidth={2.5} />
                  )}
                  <Text style={[styles.metricChangeText, { color: metric.changeUp ? '#10b981' : '#ef4444' }]}>
                    {metric.change}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Last 7 Days Performance</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {WEEKLY_DATA.map((data, index) => (
                <View key={index} style={styles.chartBarGroup}>
                  <View style={styles.chartBarContainer}>
                    <LinearGradient
                      colors={['#8b5cf6', '#7c3aed']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[styles.chartBar, { height: `${data.value}%` }]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{data.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.platformSection}>
          <Text style={styles.sectionTitle}>Platform Breakdown</Text>
          {PLATFORM_STATS.map((platform, index) => {
            const isExpanded = expandedPlatform === platform.name;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handlePlatformPress(platform.name)}
                activeOpacity={0.8}
                style={styles.platformCardWrapper}
              >
                <View style={styles.platformCardInner}>
                  <LinearGradient
                    colors={[platform.color[0] + '18', platform.color[1] + '18']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.platformGradient, isExpanded && styles.platformGradientExpanded]}
                  >
                    <View style={styles.platformMainContent}>
                      <View style={styles.platformLeftSection}>
                        <View style={[styles.platformIconWrapper, {
                          backgroundColor: platform.color[0] + '25',
                          borderColor: platform.color[0] + '40'
                        }]}>
                          <Image
                            source={{ uri: platform.icon }}
                            style={styles.platformIcon}
                          />
                        </View>
                        <View style={styles.platformInfo}>
                          <View style={styles.platformNameRow}>
                            <Text style={styles.platformName}>{platform.name}</Text>
                            <View style={[styles.growthBadge, {
                              backgroundColor: platform.growthUp ? '#10b98115' : '#ef444415'
                            }]}>
                              {platform.growthUp ? (
                                <ArrowUp color="#10b981" size={10} strokeWidth={2.5} />
                              ) : (
                                <ArrowDown color="#ef4444" size={10} strokeWidth={2.5} />
                              )}
                              <Text style={[styles.growthText, { color: platform.growthUp ? '#10b981' : '#ef4444' }]}>
                                {platform.growth}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.quickStats}>
                            <View style={styles.quickStatItem}>
                              <View style={styles.statDot} />
                              <Text style={styles.quickStatText}>{platform.followers} followers</Text>
                            </View>
                            <View style={styles.quickStatItem}>
                              <View style={styles.statDot} />
                              <Text style={styles.quickStatText}>{platform.totalReach} reach</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.expandIndicator, isExpanded && styles.expandIndicatorActive]}>
                        <View style={styles.expandLine} />
                        <View style={[styles.expandLine, styles.expandLineRotated]} />
                      </View>
                    </View>
                  </LinearGradient>

                  {isExpanded && (
                    <LinearGradient
                      colors={[platform.color[0] + '0a', platform.color[1] + '0a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.expandedGradient}
                    >
                      <View style={styles.expandedDivider}>
                        <View style={styles.dividerLine} />
                      </View>
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                          <View style={styles.detailHeader}>
                            <View style={[styles.detailIconContainer, { backgroundColor: '#60a5fa15' }]}>
                              <Eye color="#60a5fa" size={18} strokeWidth={2} />
                            </View>
                            <Text style={styles.detailValue}>15.2K</Text>
                          </View>
                          <Text style={styles.detailLabel}>Views</Text>
                          <View style={styles.detailProgress}>
                            <View style={[styles.detailProgressBar, { width: '85%', backgroundColor: '#60a5fa' }]} />
                          </View>
                        </View>
                        <View style={styles.detailItem}>
                          <View style={styles.detailHeader}>
                            <View style={[styles.detailIconContainer, { backgroundColor: '#fbbf2415' }]}>
                              <Heart color="#fbbf24" size={18} strokeWidth={2} />
                            </View>
                            <Text style={styles.detailValue}>8.2K</Text>
                          </View>
                          <Text style={styles.detailLabel}>Likes</Text>
                          <View style={styles.detailProgress}>
                            <View style={[styles.detailProgressBar, { width: '65%', backgroundColor: '#fbbf24' }]} />
                          </View>
                        </View>
                        <View style={styles.detailItem}>
                          <View style={styles.detailHeader}>
                            <View style={[styles.detailIconContainer, { backgroundColor: '#10b98115' }]}>
                              <Share2 color="#10b981" size={18} strokeWidth={2} />
                            </View>
                            <Text style={styles.detailValue}>1.7K</Text>
                          </View>
                          <Text style={styles.detailLabel}>Shares</Text>
                          <View style={styles.detailProgress}>
                            <View style={[styles.detailProgressBar, { width: '45%', backgroundColor: '#10b981' }]} />
                          </View>
                        </View>
                        <View style={styles.detailItem}>
                          <View style={styles.detailHeader}>
                            <View style={[styles.detailIconContainer, { backgroundColor: '#8b5cf615' }]}>
                              <TrendingUp color="#8b5cf6" size={18} strokeWidth={2} />
                            </View>
                            <Text style={styles.detailValue}>4.2%</Text>
                          </View>
                          <Text style={styles.detailLabel}>Engagement</Text>
                          <View style={styles.detailProgress}>
                            <View style={[styles.detailProgressBar, { width: '55%', backgroundColor: '#8b5cf6' }]} />
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
  },
  placeholder: {
    width: 48,
  },
  titleSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 44,
    fontFamily: 'Inter-Thin',
    color: '#ffffff',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  pageTitleBold: {
    fontSize: 44,
    fontFamily: 'Archivo-Bold',
    color: '#8b5cf6',
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -1,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metricChangeText: {
    fontSize: 12,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 0.2,
  },
  chartSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    gap: 8,
  },
  chartBarGroup: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarContainer: {
    width: '100%',
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chartBar: {
    width: '100%',
    borderRadius: 8,
  },
  chartLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  platformSection: {
    marginBottom: 32,
  },
  platformCardWrapper: {
    marginBottom: 16,
  },
  platformCardInner: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  platformGradient: {
    padding: 20,
  },
  platformGradientExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  platformMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  platformIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  platformIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  platformInfo: {
    flex: 1,
    gap: 8,
  },
  platformNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformName: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: 'Archivo-Bold',
    letterSpacing: -0.3,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthText: {
    fontSize: 11,
    fontFamily: 'Archivo-Bold',
    letterSpacing: 0.2,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickStatText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  expandIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  expandLine: {
    width: 12,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
    position: 'absolute',
  },
  expandLineRotated: {
    transform: [{ rotate: '90deg' }],
  },
  expandIndicatorActive: {
    transform: [{ rotate: '45deg' }],
  },
  expandedGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  expandedDivider: {
    marginBottom: 20,
    paddingTop: 16,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.5,
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  detailProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
