import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { useInventoryStore } from '../../src/store/inventoryStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function RecipesScreen() {
  const items = useInventoryStore((state) => state.items);
  const getExpiryStatus = useInventoryStore((state) => state.getExpiryStatus);
  const { theme, colors } = useTheme();

  const [isGenerating, setIsGenerating] = useState(false);

  // Get items expiring soon for recipe suggestions
  const itemsExpiringSoon = useMemo(() => {
    return items
      .filter((item) => {
        const status = getExpiryStatus(item.bestBeforeDate);
        return status.daysUntilExpiry >= 0 && status.daysUntilExpiry <= 7;
      })
      .sort((a, b) => a.bestBeforeDate.getTime() - b.bestBeforeDate.getTime())
      .slice(0, 10);
  }, [items, getExpiryStatus]);

  // Mock recipe suggestions
  const mockRecipes = [
    {
      id: '1',
      name: 'Quick Chicken Stir Fry',
      cookTime: '20 mins',
      difficulty: 'Easy',
      ingredients: ['Chicken Breast', 'Vegetables', 'Soy Sauce'],
      description: 'A simple and quick stir fry using fresh chicken and vegetables.',
    },
    {
      id: '2',
      name: 'Yogurt Parfait',
      cookTime: '5 mins',
      difficulty: 'Easy',
      ingredients: ['Yogurt', 'Berries', 'Granola'],
      description: 'Healthy breakfast or snack with layers of yogurt and fresh fruit.',
    },
    {
      id: '3',
      name: 'Pasta Primavera',
      cookTime: '25 mins',
      difficulty: 'Medium',
      ingredients: ['Pasta', 'Mixed Vegetables', 'Olive Oil'],
      description: 'Fresh seasonal vegetables tossed with pasta.',
    },
  ];

  const handleGenerateRecipes = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.headerText, { color: colors.text }]}>Recipe Suggestions</Text>
        <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>
          Get recipe ideas based on items expiring soon
        </Text>

        {/* Items Expiring Soon Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Items Expiring Soon</Text>
          {itemsExpiringSoon.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No items expiring in the next 7 days
              </Text>
            </View>
          ) : (
            <View style={[styles.ingredientsCard, { backgroundColor: colors.surface }]}>
              {itemsExpiringSoon.map((item) => {
                const status = getExpiryStatus(item.bestBeforeDate);
                return (
                  <View key={item.id} style={styles.ingredientRow}>
                    <View
                      style={[
                        styles.ingredientDot,
                        { backgroundColor: status.color },
                      ]}
                    />
                    <Text style={[styles.ingredientText, { color: colors.textSecondary }]}>
                      {item.productName}
                      {item.brand && (
                        <Text style={[styles.brandText, { color: colors.textTertiary }]}> · {item.brand}</Text>
                      )}
                    </Text>
                    <Text style={[styles.daysText, { color: status.color }]}>
                      {status.daysUntilExpiry}d
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Generate Button */}
        <Pressable
          style={[
            styles.generateButton,
            { backgroundColor: colors.primary },
            (isGenerating || itemsExpiringSoon.length === 0) &&
              [styles.generateButtonDisabled, { backgroundColor: colors.border }],
          ]}
          onPress={handleGenerateRecipes}
          disabled={isGenerating || itemsExpiringSoon.length === 0}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color={colors.surface} size="small" />
              <Text style={[styles.generateButtonText, { color: colors.surface }]}>Generating...</Text>
            </>
          ) : (
            <Text style={[styles.generateButtonText, { color: colors.surface }]}>
              ✨ Generate Recipe Ideas
            </Text>
          )}
        </Pressable>

        {/* Recipe Suggestions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Recipes</Text>
          {mockRecipes.map((recipe) => (
            <View key={recipe.id} style={[styles.recipeCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.recipeName, { color: colors.text }]}>{recipe.name}</Text>
              <View style={styles.recipeMetaContainer}>
                <View style={styles.recipeMeta}>
                  <Text style={styles.recipeMetaIcon}>⏱️</Text>
                  <Text style={[styles.recipeMetaText, { color: colors.textSecondary }]}>{recipe.cookTime}</Text>
                </View>
                <View style={styles.recipeMeta}>
                  <Text style={styles.recipeMetaIcon}>👨‍🍳</Text>
                  <Text style={[styles.recipeMetaText, { color: colors.textSecondary }]}>{recipe.difficulty}</Text>
                </View>
              </View>
              <Text style={[styles.recipeDescription, { color: colors.textSecondary }]}>{recipe.description}</Text>
              <View style={styles.ingredientsTagContainer}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={[styles.ingredientTag, { backgroundColor: colors.infoBackground }]}>
                    <Text style={[styles.ingredientTagText, { color: colors.info }]}>{ingredient}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={[styles.viewRecipeButton, { backgroundColor: colors.primary }]}>
                <Text style={[styles.viewRecipeButtonText, { color: colors.surface }]}>View Recipe</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Feature Note */}
        <View style={[styles.featureNote, { backgroundColor: colors.warningBackground, borderLeftColor: colors.warning }]}>
          <Text style={[styles.featureNoteTitle, { color: theme === 'dark' ? colors.warning : '#92400E' }]}>🚧 Coming Soon:</Text>
          <Text style={[styles.featureNoteText, { color: theme === 'dark' ? colors.textSecondary : '#78350F' }]}>
            • AI-powered recipe suggestions using OpenAI/Claude{'\n'}
            • Personalized recipes based on dietary preferences{'\n'}
            • Save favorite recipes{'\n'}
            • Generate shopping lists from recipes{'\n'}
            • Filter by cuisine type and cooking time
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  ingredientsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  brandText: {
    color: '#9CA3AF',
  },
  daysText: {
    fontSize: 14,
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaIcon: {
    fontSize: 16,
  },
  recipeMetaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  ingredientsTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ingredientTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ingredientTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  viewRecipeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewRecipeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureNote: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  featureNoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  featureNoteText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
});
