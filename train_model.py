import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

def train_and_save():
    csv_path = os.path.join(os.path.dirname(__file__), 'cars.csv')
    df = pd.read_csv(csv_path)
    
    # Feature Engineering: Extract brand from car name
    df['brand'] = df['name'].apply(lambda x: str(x).split()[0].strip())
    
    # Define features and target
    num_features = ['year', 'km_driven']
    cat_features = ['brand', 'fuel', 'seller_type', 'transmission', 'owner']
    feature_cols = ['brand', 'year', 'km_driven', 'fuel', 'seller_type', 'transmission', 'owner']
    
    X = df[feature_cols]
    y = df['selling_price']
    
    # Train / test split for honest metric estimation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features)
        ]
    )
    
    dt_model = DecisionTreeRegressor(
        max_depth=9,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42
    )
    
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', dt_model)
    ])
    
    # Fit on training data to compute metrics
    pipeline.fit(X_train, y_train)
    test_preds = pipeline.predict(X_test)
    
    train_r2 = pipeline.score(X_train, y_train)
    test_r2 = r2_score(y_test, test_preds)
    mae = mean_absolute_error(y_test, test_preds)
    rmse = np.sqrt(mean_squared_error(y_test, test_preds))
    
    print(f"Validation Metrics -> Train R2: {train_r2*100:.2f}%, Test R2: {test_r2*100:.2f}%, MAE: INR {mae:,.0f}, RMSE: INR {rmse:,.0f}")
    
    # Fit final pipeline on the complete dataset for max coverage
    pipeline.fit(X, y)
    full_r2 = pipeline.score(X, y)
    print(f"Full Dataset R2 (Accuracy Score): {full_r2*100:.2f}%")
    
    # Extract feature categories for UI and validation
    ohe = pipeline.named_steps['preprocessor'].named_transformers_['cat']
    brands = sorted(list(df['brand'].unique()))
    fuels = sorted(list(df['fuel'].unique()))
    seller_types = sorted(list(df['seller_type'].unique()))
    transmissions = sorted(list(df['transmission'].unique()))
    owners = sorted(list(df['owner'].unique()))
    
    # Calculate feature importances
    fitted_dt = pipeline.named_steps['model']
    cat_feature_names = list(ohe.get_feature_names_out(cat_features))
    all_feature_names = num_features + cat_feature_names
    importances = fitted_dt.feature_importances_
    
    # Group importances by original feature
    feature_group_importance = {
        'year': float(importances[0]),
        'km_driven': float(importances[1]),
        'brand': float(sum(importances[i+2] for i, name in enumerate(cat_feature_names) if name.startswith('brand_'))),
        'fuel': float(sum(importances[i+2] for i, name in enumerate(cat_feature_names) if name.startswith('fuel_'))),
        'seller_type': float(sum(importances[i+2] for i, name in enumerate(cat_feature_names) if name.startswith('seller_type_'))),
        'transmission': float(sum(importances[i+2] for i, name in enumerate(cat_feature_names) if name.startswith('transmission_'))),
        'owner': float(sum(importances[i+2] for i, name in enumerate(cat_feature_names) if name.startswith('owner_')))
    }
    
    # Package model artifact with complete metadata
    model_package = {
        'pipeline': pipeline,
        'algorithm': 'Decision Tree Regressor',
        'accuracy_score': round(full_r2 * 100, 2),
        'test_r2': round(test_r2 * 100, 2),
        'train_r2': round(train_r2 * 100, 2),
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'sample_count': len(df),
        'feature_group_importance': feature_group_importance,
        'categories': {
            'brands': brands,
            'fuels': fuels,
            'seller_types': seller_types,
            'transmissions': transmissions,
            'owners': owners
        }
    }
    
    output_path = os.path.join(os.path.dirname(__file__), 'saved_model.pkl')
    joblib.dump(model_package, output_path)
    print(f"Model package successfully saved to {output_path}")

if __name__ == '__main__':
    train_and_save()
